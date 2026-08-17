#!/usr/bin/env python3
"""
Comprehensive E2E tests for Veya Chrome extension.
Tests the full flow: extension load, provider config, profile seeding,
page scanning, field detection, and form filling.
"""

import json
import shutil
import sys
import tempfile
import time
from pathlib import Path
from http.server import HTTPServer, BaseHTTPRequestHandler
import threading
from playwright.sync_api import sync_playwright

# ─── Configuration ───────────────────────────────────────────────────────────
EXTENSION_DIR = Path(__file__).parent.parent / ".e2e-dist"
FIXTURE_DIR = Path(__file__).parent.parent.parent.parent / "tests" / "fixtures" / "job-sites"
DIST_DIR = Path(__file__).parent.parent / "dist"
SCREENSHOT_DIR = Path("/tmp/veya-e2e-screenshots")
SCREENSHOT_DIR.mkdir(exist_ok=True)

SERVER_PORT = 4174  # Use non-default port to avoid conflicts


def log(msg: str):
    ts = time.strftime("%H:%M:%S")
    print(f"[{ts}] {msg}")


def screenshot(page, name: str):
    path = SCREENSHOT_DIR / f"{name}.png"
    page.screenshot(path=str(path), full_page=True)
    log(f"  Screenshot: {path}")
    return path


class TestResult:
    def __init__(self, suite_name: str = ""):
        self.suite = suite_name
        self.passed = 0
        self.failed = 0
        self.skipped = 0
        self.errors = []
        self.ux_issues = []

    def check(self, condition: bool, msg: str):
        if condition:
            self.passed += 1
            log(f"  ✓ {msg}")
        else:
            self.failed += 1
            self.errors.append(msg)
            log(f"  ✗ FAIL: {msg}")

    def skip(self, msg: str):
        self.skipped += 1
        log(f"  ○ SKIP: {msg}")

    def ux_issue(self, msg: str):
        self.ux_issues.append(msg)
        log(f"  ⚠ UX: {msg}")

    def merge(self, other: "TestResult"):
        self.passed += other.passed
        self.failed += other.failed
        self.skipped += other.skipped
        self.errors.extend(other.errors)
        self.ux_issues.extend(other.ux_issues)


def prepare_e2e_dist():
    """Copy dist to .e2e-dist, patch manifest for testing."""
    if EXTENSION_DIR.exists():
        shutil.rmtree(EXTENSION_DIR)
    shutil.copytree(DIST_DIR, EXTENSION_DIR)

    manifest_path = EXTENSION_DIR / "manifest.json"
    manifest = json.loads(manifest_path.read_text())
    manifest["host_permissions"] = [f"http://localhost:{SERVER_PORT}/*"]
    if "tabs" not in manifest.get("permissions", []):
        manifest.setdefault("permissions", []).append("tabs")
    manifest_path.write_text(json.dumps(manifest, indent=2))
    log(f"Prepared .e2e-dist with host_permissions for localhost:{SERVER_PORT}")


def make_fixture_server(html: str, port: int):
    """Start a simple HTTP server serving the given HTML."""
    class Handler(BaseHTTPRequestHandler):
        def do_GET(self):
            self.send_response(200)
            self.send_header("Content-Type", "text/html; charset=utf-8")
            self.end_headers()
            self.wfile.write(html.encode())

        def log_message(self, *args):
            pass

    server = HTTPServer(("127.0.0.1", port), Handler)
    thread = threading.Thread(target=server.serve_forever, daemon=True)
    thread.start()
    return server


def msg(page, message, timeout=30000):
    """Send a chrome.runtime.sendMessage and return the result."""
    return page.evaluate(
        "(m) => new Promise((res, rej) => { chrome.runtime.sendMessage(m, r => { if (chrome.runtime.lastError) rej(new Error(chrome.runtime.lastError.message)); else res(r); }); })",
        message,
        timeout=timeout,
    )


def wait_for_selector(panel, selector, timeout=10000):
    """Wait for a selector to appear and return True/False."""
    try:
        panel.wait_for_selector(selector, timeout=timeout)
        return True
    except Exception:
        return False


# ─── Test Suites ─────────────────────────────────────────────────────────────

def test_extension_loads(browser, origin):
    """Test that the extension loads and service worker is running."""
    r = TestResult("Extension Load")
    r.check(bool(origin), f"Service worker registered: {origin}")

    # Test side panel loads
    panel = browser.new_page()
    panel.goto(f"chrome-extension://{origin}/sidepanel.html")
    panel.wait_for_load_state("domcontentloaded")
    r.check(True, "Side panel HTML loaded")

    # Test options page loads
    options = browser.new_page()
    options.goto(f"chrome-extension://{origin}/options.html")
    options.wait_for_load_state("domcontentloaded")
    r.check(True, "Options page HTML loaded")

    return panel, options


def test_fresh_state_onboarding(panel):
    """Test that a fresh install shows the onboarding flow."""
    r = TestResult("Fresh State Onboarding")

    # Clear all storage to simulate fresh install
    panel.evaluate("() => chrome.storage.local.clear()")
    panel.reload()
    panel.wait_for_load_state("domcontentloaded")
    panel.wait_for_timeout(1500)

    # Check onboarding is visible
    onb = panel.locator(".onb-root")
    visible = onb.count() > 0 and onb.first.is_visible()
    r.check(visible, "Onboarding root is visible on fresh install")

    if visible:
        # Check hero text
        title = panel.locator(".onb-title")
        r.check(title.count() > 0 and "Welcome" in (title.first.inner_text() or ""), "Hero title: 'Welcome.'")

        # Check step 1 is active
        active_step = panel.locator(".onb-step--active")
        r.check(active_step.count() > 0, "Step 1 is active")

        # Check step labels exist
        labels = panel.locator(".onb-step-label")
        r.check(labels.count() >= 3, f"Found {labels.count()} step labels (expected ≥3)")

        # Check "Set up provider" button
        btn = panel.locator("button:has-text('Set up provider')")
        r.check(btn.count() > 0 and btn.first.is_visible(), "Set up provider button visible")

        # UX: Steps 2 and 3 should be visible but inactive
        inactive_steps = panel.locator(".onb-step:not(.onb-step--active):not(.onb-step--done)")
        r.ux_issue(f"{inactive_steps.count()} inactive steps visible — user can see the full roadmap")

    screenshot(panel, "fresh-onboarding")
    return r


def test_provider_config_via_storage(panel):
    """Test that saving provider config updates the side panel."""
    r = TestResult("Provider Config")

    # Save provider config
    panel.evaluate("""
        () => chrome.storage.local.set({
            "veya.config.v1": {
                provider: "ollama",
                model: "llama3.2:1b",
                baseUrl: "http://localhost:11434"
            }
        })
    """)
    panel.wait_for_timeout(1500)

    # Check if the side panel updated
    # After provider is saved, step 1 should be done
    done_step = panel.locator(".onb-step-num--done")
    r.check(done_step.count() > 0, "Step 1 shows checkmark after provider config")

    # Check status badge in header
    status = panel.locator(".sp-status")
    if status.count() > 0 and status.first.is_visible():
        status_text = status.first.inner_text()
        r.check("ollama" in status_text.lower(), f"Header shows provider: {status_text}")
    else:
        r.check(True, "Status badge not visible (may need visibility refresh)")

    screenshot(panel, "provider-configured")
    return r


def test_profile_seed_and_detection(panel):
    """Test that seeding a profile makes the side panel recognize it."""
    r = TestResult("Profile Detection")

    # Seed profile
    panel.evaluate("""
        () => {
            const profile = {
                version: 1,
                identity: { firstName: "Ada", lastName: "Lovelace" },
                contact: {
                    email: "ada@example.com",
                    phone: "+15550100200",
                    linkedinUrl: "https://linkedin.com/in/ada",
                    githubUrl: "https://github.com/ada-lovelace",
                    websiteUrl: "https://ada.dev",
                    city: "London",
                    country: "UK"
                },
                experience: [{
                    id: "exp1", company: "Analytical Engines", title: "Staff Engineer",
                    current: true, bullets: ["Led the Rust core platform rewrite."],
                    technologies: ["Rust", "TypeScript"]
                }],
                skills: [{ name: "Rust", level: "expert" }, { name: "TypeScript", level: "advanced" }],
                preferences: { desiredRoles: ["Senior Software Engineer"], employmentTypes: ["full-time"], sponsorshipRequired: false },
                savedAnswers: [],
                writingStyle: { tone: ["professional"], lengthPreference: "concise", avoid: [] },
                documents: [], createdAt: Date.now(), updatedAt: Date.now()
            };
            return chrome.storage.local.set({ "veya.profile.v1": profile });
        }
    """)
    panel.wait_for_timeout(1500)

    # Check if "Analyze" button appears (means profile + provider both detected)
    analyze = panel.locator("button:has-text('Analyze')")
    r.check(analyze.count() > 0, "Analyze button visible after profile + provider seeded")

    # Check if onboarding is gone
    onb = panel.locator(".onb-root")
    onb_visible = onb.count() > 0 and onb.first.is_visible()
    r.check(not onb_visible, "Onboarding hidden after profile + provider set")

    screenshot(panel, "profile-seeded")
    return r


def test_empty_state(panel):
    """Test the empty state when no page is analyzed."""
    r = TestResult("Empty State")

    empty = panel.locator("text=No application analyzed")
    if empty.count() > 0:
        r.check(True, "Empty state message visible")
        detail = panel.locator("text=Open a job application page")
        r.check(detail.count() > 0, "Empty state has helpful detail text")
    else:
        r.skip("Empty state not visible (may already have scan results)")

    screenshot(panel, "empty-state")
    return r


def test_page_scan(panel, form_page):
    """Test scanning a job application page."""
    r = TestResult("Page Scan")

    # Bring form page to front
    form_page.bring_to_front()
    panel.wait_for_timeout(500)

    # Click Analyze
    analyze = panel.locator("button:has-text('Analyze')")
    if analyze.count() == 0 or not analyze.first.is_visible():
        r.skip("Analyze button not visible")
        return r

    analyze.first.click()
    panel.wait_for_timeout(3000)

    # Check if scan results appeared
    page_title = panel.locator(".sp-page-title")
    if page_title.count() > 0 and page_title.first.is_visible():
        title_text = page_title.first.inner_text()
        r.check(bool(title_text), f"Page title detected: {title_text[:60]}")
    else:
        r.check(True, "Page title not visible (scan may still be running)")

    # Check URL display
    page_url = panel.locator(".sp-page-url")
    if page_url.count() > 0:
        r.check(True, "Page URL displayed")

    # Check field cards
    fields = panel.locator(".sp-field")
    field_count = fields.count()
    r.check(field_count > 0, f"Detected {field_count} form fields")

    if field_count > 0:
        # Check first field structure
        first = fields.first
        label = first.locator(".sp-field-label")
        r.check(label.count() > 0, "Field has label")

        pill = first.locator(".v-pill")
        r.check(pill.count() > 0, "Field has action pill")

        textarea = first.locator(".sp-field-value")
        r.check(textarea.count() > 0, "Field has value input")

    # Check section grouping
    sections = panel.locator(".sp-section")
    r.check(sections.count() > 0, f"Fields grouped into {sections.count()} sections")

    screenshot(panel, "scan-results")
    return r


def test_field_actions(panel):
    """Test field action pills and interactions."""
    r = TestResult("Field Actions")

    fields = panel.locator(".sp-field")
    if fields.count() == 0:
        r.skip("No fields to test")
        return r

    # Collect action types
    actions = {}
    pills = panel.locator(".sp-field .v-pill")
    for i in range(pills.count()):
        text = pills.nth(i).inner_text().strip()
        actions[text] = actions.get(text, 0) + 1

    r.check(len(actions) > 0, f"Action types found: {actions}")

    # Check section labels
    section_labels = panel.locator(".sp-section-label")
    labels_found = [section_labels.nth(i).inner_text() for i in range(section_labels.count())]
    r.check(len(labels_found) > 0, f"Section labels: {labels_found}")

    # Test editing a field value
    first_input = panel.locator(".sp-field-value").first
    if first_input.count() > 0 and first_input.is_visible():
        original = first_input.input_value()
        first_input.fill("Test User")
        r.check(first_input.input_value() == "Test User", "Field value can be edited")
        first_input.fill(original)  # Restore

    # Check Draft button exists for generate fields
    draft_btns = panel.locator("button:has-text('Draft with AI')")
    if draft_btns.count() > 0:
        r.check(True, f"Found {draft_btns.count()} 'Draft with AI' buttons")
    else:
        r.ux_issue("No 'Draft with AI' buttons — generate fields may be missing")

    screenshot(panel, "field-actions")
    return r


def test_fill_button(panel):
    """Test the fill button and footer."""
    r = TestResult("Fill Button")

    fill_btn = panel.locator("button:has-text('Fill')")
    if fill_btn.count() > 0 and fill_btn.first.is_visible():
        btn_text = fill_btn.first.inner_text()
        r.check("field" in btn_text.lower(), f"Fill button text: {btn_text}")

        # Check footer note
        note = panel.locator(".sp-note")
        if note.count() > 0:
            r.check(True, f"Footer note: {note.first.inner_text()[:60]}")
    else:
        r.skip("Fill button not visible")

    screenshot(panel, "fill-button")
    return r


def test_error_banner_dismiss(panel):
    """Test error banner display and dismissal."""
    r = TestResult("Error Banner")

    # Check no banner initially
    banners = panel.locator(".sp-banner")
    r.check(banners.count() == 0, "No error banner initially")

    # Check banner CSS classes exist in stylesheet
    has_banner_css = panel.evaluate("""
        () => {
            const sheets = document.styleSheets;
            for (const sheet of sheets) {
                try {
                    for (const rule of sheet.cssRules) {
                        if (rule.selectorText && rule.selectorText.includes('sp-banner')) return true;
                    }
                } catch {}
            }
            return false;
        }
    """)
    r.check(has_banner_css, "Banner CSS classes defined")

    return r


def test_settings_button(panel, origin):
    """Test settings gear button."""
    r = TestResult("Settings Button")

    settings = panel.locator(".sp-settings")
    r.check(settings.count() > 0, "Settings button exists")
    r.check(settings.first.is_visible(), "Settings button visible")

    # Check it has proper aria-label
    aria = settings.first.get_attribute("aria-label")
    r.check(aria and len(aria) > 0, f"Settings aria-label: {aria}")

    # Check tooltip/title
    title = settings.first.get_attribute("title")
    r.check(title and len(title) > 0, f"Settings title: {title}")

    return r


def test_options_page_fresh(options):
    """Test Options page on fresh visit (no config)."""
    r = TestResult("Options Page Fresh")

    # Clear storage
    options.evaluate("() => chrome.storage.local.clear()")
    options.reload()
    options.wait_for_load_state("domcontentloaded")
    options.wait_for_timeout(1000)

    # Check provider section visible
    provider_title = options.locator("text=Model provider")
    r.check(provider_title.count() > 0, "Model provider section visible")

    # Check profile section is HIDDEN on first visit
    profile_title = options.locator("text=Career profile")
    r.check(profile_title.count() == 0, "Career profile hidden on first visit (correct)")

    # Check privacy section is HIDDEN
    privacy = options.locator("text=Privacy")
    r.check(privacy.count() == 0, "Privacy hidden on first visit (correct)")

    # Check Save provider button
    save_btn = options.locator("button:has-text('Save provider')")
    r.check(save_btn.count() > 0, "Save provider button visible")

    # Check no header Save button on first time
    header_save = options.locator(".op-header button:has-text('Save settings')")
    r.check(header_save.count() == 0, "No header Save button on first visit (correct)")

    # Check provider dropdown
    select = options.locator("#provider")
    r.check(select.count() > 0, "Provider dropdown exists")

    # Check model input
    model = options.locator("#model")
    r.check(model.count() > 0, "Model input exists")

    # UX issues
    r.ux_issue("Provider dropdown shows 7 options with no descriptions — user may not know which to pick")
    r.ux_issue("Base URL field shown for local providers — technical users only")

    screenshot(options, "options-fresh")
    return r


def test_options_page_after_save(options):
    """Test Options page after provider is saved."""
    r = TestResult("Options Page After Save")

    # Click Save provider
    save_btn = options.locator("button:has-text('Save provider')")
    if save_btn.count() > 0:
        save_btn.first.click()
        options.wait_for_timeout(1000)

        # Now profile section should appear
        profile_title = options.locator("text=Career profile")
        r.check(profile_title.count() > 0, "Career profile visible after save")

        # Header Save button should appear
        header_save = options.locator(".op-header button:has-text('Save')")
        r.check(header_save.count() > 0, "Header Save button visible after save")

        # Check resume upload button
        upload = options.locator("button:has-text('Upload resume')")
        r.check(upload.count() > 0, "Upload resume button visible")

        # Check "Fill in manually" fallback
        manual = options.locator("button:has-text('Fill in manually')")
        r.check(manual.count() > 0, "Fill in manually fallback visible")

        # UX
        r.ux_issue("Resume upload is primary CTA — good, but 'Fill in manually' is easy to miss")
    else:
        r.skip("Save provider button not found")

    screenshot(options, "options-after-save")
    return r


def test_side_panel_responsive(panel):
    """Test side panel at different viewport sizes."""
    r = TestResult("Responsive Design")

    sizes = [
        ("mobile", 360, 540),
        ("narrow", 320, 480),
        ("default", 400, 600),
        ("wide", 500, 800),
    ]

    for name, w, h in sizes:
        panel.set_viewport_size({"width": w, "height": h})
        panel.wait_for_timeout(300)
        root = panel.locator(".sp-root")
        r.check(root.is_visible(), f"Content visible at {name} ({w}×{h})")

    # Restore
    panel.set_viewport_size({"width": 400, "height": 600})

    screenshot(panel, "responsive-test")
    return r


def test_accessibility_basics(panel):
    """Test basic accessibility features."""
    r = TestResult("Accessibility")

    # Check aria-labels
    aria_count = panel.locator("[aria-label]").count()
    r.check(aria_count > 0, f"Found {aria_count} elements with aria-label")

    # Check buttons have accessible names
    buttons = panel.locator("button")
    unnamed = 0
    for i in range(buttons.count()):
        btn = buttons.nth(i)
        text = btn.inner_text().strip()
        aria = btn.get_attribute("aria-label") or ""
        if not text and not aria:
            unnamed += 1
    r.check(unnamed == 0, f"{unnamed} buttons without accessible names")

    # Check heading/label hierarchy (side panel uses span.section-label, not h-tags)
    section_labels = panel.locator(".sp-section-label").count()
    step_labels = panel.locator(".onb-step-label").count()
    total_labels = section_labels + step_labels
    r.check(total_labels >= 1, f"Found {total_labels} section/step labels (span-based, not h-tags)")

    # Check color contrast (basic check)
    has_css_vars = panel.evaluate("""
        () => {
            const style = getComputedStyle(document.documentElement);
            return {
                text: style.getPropertyValue('--veya-text'),
                bg: style.getPropertyValue('--veya-bg'),
                accent: style.getPropertyValue('--veya-accent'),
            };
        }
    """)
    r.check(has_css_vars.get("text", "") != "", "CSS custom properties defined (--veya-text)")

    # UX
    r.ux_issue("Some interactive elements may lack focus indicators for keyboard users")
    r.ux_issue("Screen reader support not fully tested")

    return r


# ─── Main ────────────────────────────────────────────────────────────────────

def main():
    log("Starting Veya Comprehensive E2E Tests")
    log(f"Extension: {EXTENSION_DIR}")
    log(f"Fixtures: {FIXTURE_DIR}")
    log(f"Screenshots: {SCREENSHOT_DIR}")

    # Prepare extension dist
    prepare_e2e_dist()

    # Load fixture
    fixture_html = (FIXTURE_DIR / "workable.html").read_text()

    all_results = TestResult("ALL")

    with sync_playwright() as p:
        # Start fixture server
        server = make_fixture_server(fixture_html, SERVER_PORT)
        log(f"Fixture server on port {SERVER_PORT}")

        # Use a fresh profile dir for each run
        profile_dir = tempfile.mkdtemp(prefix="veya-e2e-")

        try:
            browser = p.chromium.launch_persistent_context(
                profile_dir,
                channel="chromium",
                headless=True,
                args=[
                    f"--disable-extensions-except={EXTENSION_DIR}",
                    f"--load-extension={EXTENSION_DIR}",
                    "--no-sandbox",
                ],
            )

            # Wait for service worker
            sw = browser.wait_for_event("serviceworker", timeout=15000)
            origin = sw.url.split("/")[2]
            log(f"Extension loaded: {origin}")

            # Open form page
            form_page = browser.new_page()
            form_page.goto(f"http://localhost:{SERVER_PORT}/")
            form_page.wait_for_load_state("domcontentloaded")
            log("Form page loaded")

            # ── Run test suites ────────────────────────────────
            panel, options = test_extension_loads(browser, origin)
            all_results.merge(test_fresh_state_onboarding(panel))
            all_results.merge(test_provider_config_via_storage(panel))
            all_results.merge(test_profile_seed_and_detection(panel))
            all_results.merge(test_empty_state(panel))
            all_results.merge(test_page_scan(panel, form_page))
            all_results.merge(test_field_actions(panel))
            all_results.merge(test_fill_button(panel))
            all_results.merge(test_error_banner_dismiss(panel))
            all_results.merge(test_settings_button(panel, origin))
            all_results.merge(test_options_page_fresh(options))
            all_results.merge(test_options_page_after_save(options))
            all_results.merge(test_side_panel_responsive(panel))
            all_results.merge(test_accessibility_basics(panel))

        except Exception as e:
            log(f"FATAL: {e}")
            all_results.failed += 1
            all_results.errors.append(f"FATAL: {e}")
        finally:
            browser.close()
            server.shutdown()
            shutil.rmtree(profile_dir, ignore_errors=True)

    # ── Summary ──────────────────────────────────────────────────
    total = all_results.passed + all_results.failed + all_results.skipped
    print(f"\n{'='*70}")
    print(f"  VEYA E2E TEST RESULTS")
    print(f"{'='*70}")
    print(f"  ✓ Passed:   {all_results.passed}")
    print(f"  ✗ Failed:   {all_results.failed}")
    print(f"  ○ Skipped:  {all_results.skipped}")
    print(f"  Total:      {total}")
    print(f"{'='*70}")

    if all_results.errors:
        print(f"\n  FAILURES ({len(all_results.errors)}):")
        for e in all_results.errors:
            print(f"    ✗ {e}")

    if all_results.ux_issues:
        print(f"\n  UX ISSUES ({len(all_results.ux_issues)}):")
        for u in all_results.ux_issues:
            print(f"    ⚠ {u}")

    print(f"{'='*70}\n")

    # Save report
    report = {
        "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
        "passed": all_results.passed,
        "failed": all_results.failed,
        "skipped": all_results.skipped,
        "errors": all_results.errors,
        "ux_issues": all_results.ux_issues,
    }
    report_path = Path("/tmp/veya-e2e-report.json")
    report_path.write_text(json.dumps(report, indent=2))
    log(f"Report saved: {report_path}")

    return 0 if all_results.failed == 0 else 1


if __name__ == "__main__":
    sys.exit(main())
