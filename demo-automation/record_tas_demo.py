#!/usr/bin/env python3
"""Render the repeatable TAS v70.20.3 guided product tour.

The script drives the real synthetic Demo in Chromium, captures each verified
interaction state, then renders a smooth MP4 with timed on-screen captions,
click pulses, SRT and WebVTT subtitles. It is intentionally deterministic and
repeatable; OBS is not required.

Security boundary: the script only uses the separate synthetic Demo build. It
never loads customer evidence or the commercial TAS Golden baseline.
"""
from __future__ import annotations

import contextlib
import functools
import http.server
import json
import os
import shutil
import socket
import subprocess
import sys
import threading
from dataclasses import dataclass, asdict
from pathlib import Path
from typing import Callable, Optional

from playwright.sync_api import Page, sync_playwright

ROOT = Path(__file__).resolve().parents[1]
PUBLIC = ROOT / "public"
DEMO_BUILD = ROOT / "dist-editions" / "demo"
MEDIA = PUBLIC / "media"
WORK = ROOT / "demo-automation" / ".recording-work"
SITE = WORK / "site"
SCENES = WORK / "scenes"
OUTPUT_MP4 = MEDIA / "TAS_Interactive_Product_Tour.mp4"
OUTPUT_SRT = MEDIA / "TAS_Interactive_Product_Tour.en.srt"
OUTPUT_VTT = MEDIA / "TAS_Interactive_Product_Tour.en.vtt"
OUTPUT_POSTER = MEDIA / "TAS_Interactive_Product_Tour_Poster.png"
OUTPUT_MANIFEST = MEDIA / "TAS_Interactive_Product_Tour.manifest.json"
def resolve_chromium() -> str:
    override = os.environ.get("TAS_CHROMIUM")
    if override:
        return override
    candidates = [
        shutil.which("chromium"), shutil.which("chromium-browser"),
        shutil.which("google-chrome"), shutil.which("google-chrome-stable"),
        shutil.which("msedge"), shutil.which("chrome"),
    ]
    if os.name == "nt":
        for base in (os.environ.get("PROGRAMFILES"), os.environ.get("PROGRAMFILES(X86)"), os.environ.get("LOCALAPPDATA")):
            if base:
                candidates.extend([
                    str(Path(base) / "Google/Chrome/Application/chrome.exe"),
                    str(Path(base) / "Microsoft/Edge/Application/msedge.exe"),
                ])
    for candidate in candidates:
        if candidate and Path(candidate).exists():
            return str(candidate)
    raise RuntimeError("Chromium, Chrome or Edge was not found. Set TAS_CHROMIUM to the browser executable path.")

CHROMIUM = resolve_chromium()
FFMPEG = os.environ.get("TAS_FFMPEG", "/usr/bin/ffmpeg")
WIDTH = 1440
HEIGHT = 900
FPS = 8
SCENE_SECONDS = 2.7


@dataclass
class Scene:
    index: int
    start: float
    end: float
    text: str
    action: str
    image: str
    cursor_x: float
    cursor_y: float


class QuietHandler(http.server.SimpleHTTPRequestHandler):
    def log_message(self, fmt: str, *args: object) -> None:
        return


def free_port() -> int:
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
        sock.bind(("0.0.0.0", 0))
        return int(sock.getsockname()[1])


def copy_tree(source: Path, target: Path) -> None:
    if source.exists():
        shutil.copytree(source, target, dirs_exist_ok=True)


def prepare_site() -> None:
    if not (DEMO_BUILD / "index.html").exists():
        subprocess.run(["npm", "run", "build:demo"], cwd=ROOT, check=True)
    shutil.rmtree(WORK, ignore_errors=True)
    SITE.mkdir(parents=True, exist_ok=True)
    SCENES.mkdir(parents=True, exist_ok=True)
    copy_tree(PUBLIC / "member", SITE / "member")
    copy_tree(PUBLIC / "member-resources", SITE / "member-resources")
    copy_tree(PUBLIC / "studio", SITE / "studio")
    copy_tree(DEMO_BUILD, SITE / "demo")
    shutil.copy2(PUBLIC / "member" / "index.html", SITE / "index.html")
    for name in ("tas-workspace-parity.js", "tas-member-extension.js"):
        source = PUBLIC / name
        if source.exists():
            shutil.copy2(source, SITE / name)
    # Recording fixture: displays verified installer metadata but never exposes the MSI.
    (SITE / "TAS_INSTALLER_STATUS.json").write_text(
        json.dumps(
            {
                "release": "70.20.3",
                "publicDownloadPublished": False,
                "protectedInstallerStaged": True,
                "artifact": {
                    "fileName": "TAS_Professional_v10_0_6_x64.msi",
                    "bytes": 57430016,
                    "productVersion": "10.0.6",
                    "architecture": "x64",
                    "sha256": "f59a8682e78b94eff561b44db66fc61089c8f5156f82f5d0a7bf54099b5da249",
                },
                "guidedTourPublished": True,
                "securityBoundary": "Recording fixture only. Public installer delivery remains disabled.",
            },
            indent=2,
        ),
        encoding="utf-8",
    )


@contextlib.contextmanager
def static_server(root: Path):
    port = free_port()
    handler = functools.partial(QuietHandler, directory=str(root))
    server = http.server.ThreadingHTTPServer(("0.0.0.0", port), handler)
    server.daemon_threads = True
    thread = threading.Thread(target=server.serve_forever, daemon=True)
    thread.start()
    host = os.environ.get("TAS_RECORDING_HOST", "127.0.0.1")
    try:
        yield f"http://{host}:{port}"
    finally:
        server.shutdown()
        server.server_close()
        thread.join(timeout=3)


def install_recording_ui(page: Page) -> None:
    page.evaluate(
        """
        () => {
          if (document.getElementById('tas-tour-overlay')) return;
          const style = document.createElement('style');
          style.id = 'tas-tour-style';
          style.textContent = `
            #tas-tour-overlay{position:fixed;left:50%;bottom:20px;transform:translateX(-50%);z-index:2147483646;width:min(1120px,calc(100vw - 80px));padding:14px 22px;border:1px solid rgba(80,205,255,.72);border-left:5px solid #ff7a00;border-radius:12px;background:linear-gradient(90deg,rgba(3,20,45,.97),rgba(8,51,91,.95));box-shadow:0 18px 60px rgba(0,0,0,.45);color:#fff;font:700 21px/1.35 'Segoe UI',Arial,sans-serif;letter-spacing:.01em;text-align:center;pointer-events:none}
            #tas-tour-overlay small{display:block;margin-top:3px;color:#7ee5ff;font-size:11px;letter-spacing:.18em;text-transform:uppercase}
            #tas-tour-cursor{position:fixed;z-index:2147483647;width:24px;height:24px;border:3px solid #ff7a00;border-radius:50%;background:rgba(255,122,0,.18);box-shadow:0 0 0 7px rgba(255,122,0,.17),0 0 28px rgba(255,122,0,.85);transform:translate(-50%,-50%);left:58px;top:82px;pointer-events:none}
            #tas-tour-badge{position:fixed;right:18px;top:18px;z-index:2147483646;padding:8px 12px;border:1px solid rgba(126,229,255,.45);border-radius:999px;background:rgba(3,20,45,.9);color:#7ee5ff;font:800 10px/1 'Segoe UI',Arial,sans-serif;letter-spacing:.16em;text-transform:uppercase;pointer-events:none}
          `;
          document.head.appendChild(style);
          const overlay = document.createElement('div');
          overlay.id = 'tas-tour-overlay';
          overlay.innerHTML = '<div id="tas-tour-caption"></div><small>Telemetry Assurance Studio · Guided product tour</small>';
          const cursor = document.createElement('div'); cursor.id = 'tas-tour-cursor';
          const badge = document.createElement('div'); badge.id = 'tas-tour-badge'; badge.textContent = 'Synthetic demo · no customer evidence';
          document.body.append(overlay,cursor,badge);
          window.__tasTour = {
            caption(text){document.getElementById('tas-tour-caption').textContent=text;},
            move(x,y){cursor.style.left=x+'px';cursor.style.top=y+'px';}
          };
        }
        """
    )


def set_caption(page: Page, text: str) -> None:
    install_recording_ui(page)
    page.evaluate("text => window.__tasTour.caption(text)", text)


def set_cursor(page: Page, x: float, y: float) -> tuple[float, float]:
    install_recording_ui(page)
    page.evaluate("([x,y]) => window.__tasTour.move(x,y)", [x, y])
    return x, y


def click_text(page: Page, text: str, *, exact: bool = True, timeout: int = 10000) -> tuple[float, float]:
    locator = page.get_by_text(text, exact=exact).first
    locator.wait_for(state="visible", timeout=timeout)
    locator.scroll_into_view_if_needed()
    box = locator.bounding_box()
    point = (90.0, 90.0)
    if box:
        point = set_cursor(page, box["x"] + box["width"] / 2, box["y"] + box["height"] / 2)
    locator.click()
    page.wait_for_timeout(350)
    return point


def click_selector(page: Page, selector: str, *, index: int = 0, timeout: int = 10000) -> tuple[float, float]:
    locator = page.locator(selector).nth(index)
    locator.wait_for(state="visible", timeout=timeout)
    locator.scroll_into_view_if_needed()
    box = locator.bounding_box()
    point = (90.0, 90.0)
    if box:
        point = set_cursor(page, box["x"] + box["width"] / 2, box["y"] + box["height"] / 2)
    locator.click()
    page.wait_for_timeout(450)
    return point


def scroll_element(page: Page, selector: str, amount: int) -> tuple[float, float]:
    locator = page.locator(selector).first
    locator.wait_for(state="visible", timeout=10000)
    box = locator.bounding_box()
    point = (WIDTH - 80.0, HEIGHT / 2)
    if box:
        point = set_cursor(page, box["x"] + box["width"] - 24, box["y"] + min(120, box["height"] / 2))
    locator.evaluate("(el,amount) => { el.scrollTop += amount; el.scrollLeft += Math.round(amount * .28); }", amount)
    page.wait_for_timeout(350)
    return point


def fmt_srt(seconds: float) -> str:
    milliseconds = max(0, int(round(seconds * 1000)))
    hours, remainder = divmod(milliseconds, 3_600_000)
    minutes, remainder = divmod(remainder, 60_000)
    secs, millis = divmod(remainder, 1000)
    return f"{hours:02d}:{minutes:02d}:{secs:02d},{millis:03d}"


def fmt_vtt(seconds: float) -> str:
    return fmt_srt(seconds).replace(",", ".")


def write_subtitles(scenes: list[Scene]) -> None:
    srt_blocks: list[str] = []
    vtt_blocks = ["WEBVTT", "", "NOTE TAS v70.20.3 scripted synthetic product tour", ""]
    for scene in scenes:
        srt_blocks.append(f"{scene.index}\n{fmt_srt(scene.start)} --> {fmt_srt(scene.end)}\n{scene.text}\n")
        vtt_blocks.append(f"{scene.index}\n{fmt_vtt(scene.start)} --> {fmt_vtt(scene.end)}\n{scene.text}\n")
    OUTPUT_SRT.write_text("\n".join(srt_blocks), encoding="utf-8")
    OUTPUT_VTT.write_text("\n".join(vtt_blocks), encoding="utf-8")


def capture_scenes() -> tuple[list[Scene], list[str]]:
    prepare_site()
    MEDIA.mkdir(parents=True, exist_ok=True)
    scenes: list[Scene] = []
    warnings: list[str] = []
    current_cursor = (90.0, 90.0)

    with static_server(SITE) as base_url, sync_playwright() as playwright:
        browser = playwright.chromium.launch(
            executable_path=CHROMIUM,
            headless=True,
            args=["--no-sandbox", "--disable-dev-shm-usage", "--disable-gpu", "--no-proxy-server", "--font-render-hinting=none"],
        )
        context = browser.new_context(viewport={"width": WIDTH, "height": HEIGHT}, device_scale_factor=1, accept_downloads=True)
        page = context.new_page()
        page.set_default_timeout(12000)
        page.goto(base_url + "/", wait_until="networkidle")
        # Poster is the clean landing page, without tour overlays.
        page.screenshot(path=str(OUTPUT_POSTER), full_page=False)

        def scene(text: str, action: str, work: Optional[Callable[[], Optional[tuple[float, float]]]] = None, seconds: float = SCENE_SECONDS) -> None:
            nonlocal current_cursor
            print(f"[SCENE {len(scenes)+1:02d}] {action}", flush=True)
            if work:
                try:
                    result = work()
                    if result:
                        current_cursor = result
                except Exception as exc:
                    warning = f"{action}: {type(exc).__name__}: {exc}"
                    warnings.append(warning)
                    print(f"[WARN] {warning}", flush=True)
            page.wait_for_timeout(220)
            install_recording_ui(page)
            set_caption(page, text)
            set_cursor(page, *current_cursor)
            image = SCENES / f"scene_{len(scenes)+1:02d}.jpg"
            page.screenshot(path=str(image), type="jpeg", quality=82, full_page=False, animations="disabled")
            start = sum(item.end - item.start for item in scenes)
            scenes.append(Scene(len(scenes)+1, start, start + seconds, text, action, image.name, current_cursor[0], current_cursor[1]))

        scene("Start at the TAS Member Gateway: compare editions, watch the tour or enter the free synthetic Demo.", "gateway-introduction")
        scene("The free Demo is interactive and report-capable, while Professional and Consultant remain protected commercial editions.", "gateway-editions", lambda: (page.evaluate("window.scrollTo(0,720)"), (WIDTH - 80.0, HEIGHT / 2))[1])
        scene("Open the Demo. It uses fixed synthetic evidence and never reveals the commercial Golden baseline.", "open-demo", lambda: click_selector(page, "a[href=\"/demo/\"]", index=0))
        page.wait_for_url("**/demo/**", timeout=12000)
        page.wait_for_load_state("networkidle")

        scene("The familiar AURORA command centre is retained: workflow, posture, evidence and outputs remain in one workspace.", "demo-dashboard")
        scene("Evidence Intake already contains a fixed two-asset synthetic auditpol pack.", "evidence-intake", lambda: click_text(page, "Evidence Intake"))
        scene("Generate Advanced Plus assurance. The Demo runs the full interaction and reporting path against synthetic controls.", "generate-assurance", lambda: click_text(page, "Generate Advanced Plus from manual"), 3.0)
        page.wait_for_selector(".premiumGoldenSplit", timeout=12000)

        scene("The Premium Golden matrix compares assets left-to-right and supports its own scrolling pane.", "golden-matrix", lambda: scroll_element(page, ".premiumGoldenMatrixScroll", 280))
        scene("Select a Golden result row. The matching finding is resolved and the lower detail pane updates automatically.", "golden-row-to-details", lambda: click_selector(page, ".premiumGoldenTable tbody tr", index=1), 3.0)
        scene("Use the draggable splitter to give more space to either the matrix or the selected-finding details.", "splitter", lambda: (page.locator(".rowSplitter").press("ArrowDown"), set_cursor(page, WIDTH / 2, HEIGHT * 0.57))[1])
        scene("Switch to the raw assurance grid and select any result row.", "raw-grid", lambda: click_text(page, "Raw assurance grid"))
        scene("The lower pane self-populates with status, expected and actual settings, Event IDs, frameworks and remediation.", "raw-row-details", lambda: click_selector(page, ".desktopTopGrid tbody tr", index=3), 3.0)
        scene("The top results grid and lower details pane scroll independently, preserving context during investigation.", "independent-scroll", lambda: (scroll_element(page, ".desktopTopGrid", 520), scroll_element(page, ".premiumBottomPane .detailsPane", 420))[1])

        scene("Open the HTML report preview without leaving the assurance workspace.", "html-preview", lambda: click_text(page, "HTML report preview"))
        scene("Add the detailed evidence report to the browser-local output vault.", "report-output", lambda: click_text(page, "Add to output folder"))
        scene("The output vault records the generated artefact and offers a direct local download.", "output-vault", seconds=2.5)
        try:
            click_text(page, "Close")
        except Exception as exc:
            warnings.append(f"close-output: {exc}")

        scene("Before / After compares fixed current and remediated evidence and highlights improved, regressed and unchanged controls.", "before-after", lambda: click_text(page, "Before / After"), 3.0)
        scene("The Baseline Library demonstrates searchable control intelligence and Golden comparison structure using synthetic data only.", "baseline-library", lambda: click_text(page, "Baseline Library"), 3.0)
        scene("Event ID Intelligence provides sortable analyst context, collection sources and triage guidance.", "event-intelligence", lambda: click_text(page, "Event IDs"))
        scene("Select an event to populate its analyst detail pane.", "event-detail", lambda: click_selector(page, ".eventTablePane tbody tr", index=2))

        scene("Return to the Member Gateway to review licensing, verified hashes and the protected installer journey.", "return-gateway", lambda: (page.goto(base_url + "/member/downloads.html", wait_until="networkidle"), (90.0, 90.0))[1], 3.0)
        scene("The real x64 TAS v10.0.6 MSI is staged and hash-verified, but the public site never exposes it directly.", "installer-vault", lambda: (page.evaluate("window.scrollTo(0,520)"), (WIDTH - 90.0, HEIGHT / 2))[1], 3.0)
        scene("A valid Professional or Consultant entitlement unlocks the protected download; the installed app then validates the signed licence and machine binding.", "licence-boundary", seconds=3.2)
        scene("TAS turns raw Windows audit evidence into defensible security assurance—free to explore, licensed for real customer evidence.", "closing", seconds=3.3)

        context.close()
        browser.close()

    return scenes, warnings


def render_video(scenes: list[Scene]) -> float:
    if not scenes:
        raise RuntimeError("No tour scenes were captured")
    concat = WORK / "tour-concat.txt"
    lines: list[str] = []
    for scene in scenes:
        image = (SCENES / scene.image).resolve()
        lines.append(f"file '{image}'")
        lines.append(f"duration {scene.end - scene.start:.3f}")
    lines.append(f"file '{(SCENES / scenes[-1].image).resolve()}'")
    concat.write_text("\n".join(lines) + "\n", encoding="utf-8")
    command = [
        FFMPEG, "-y", "-f", "concat", "-safe", "0", "-i", str(concat),
        "-vf", f"fps={FPS},format=yuv420p",
        "-c:v", "libx264", "-preset", "veryfast", "-crf", "20",
        "-movflags", "+faststart", "-an", str(OUTPUT_MP4),
    ]
    result = subprocess.run(command, stdout=subprocess.DEVNULL, stderr=subprocess.PIPE, text=True)
    if result.returncode != 0:
        raise RuntimeError(f"FFmpeg video render failed: {result.stderr[-1400:]}")
    return scenes[-1].end


def main() -> int:
    try:
        scenes, warnings = capture_scenes()
        duration = render_video(scenes)
        write_subtitles(scenes)
        manifest = {
            "product": "Telemetry Assurance Studio",
            "release": "70.20.3",
            "tour": "TAS Interactive Product Tour",
            "durationSeconds": round(duration, 3),
            "fps": FPS,
            "resolution": {"width": WIDTH, "height": HEIGHT},
            "video": OUTPUT_MP4.name,
            "subtitles": [OUTPUT_SRT.name, OUTPUT_VTT.name],
            "poster": OUTPUT_POSTER.name,
            "captureMethod": "Scripted Chromium interaction states rendered to MP4",
            "syntheticOnly": True,
            "commercialGoldenBaselineIncluded": False,
            "scenes": [asdict(item) for item in scenes],
            "warnings": warnings,
        }
        OUTPUT_MANIFEST.write_text(json.dumps(manifest, indent=2), encoding="utf-8")
    except Exception as exc:
        print(f"[FAIL] TAS guided tour generation failed: {type(exc).__name__}: {exc}", file=sys.stderr, flush=True)
        return 1
    print(f"[PASS] Created {OUTPUT_MP4} ({OUTPUT_MP4.stat().st_size:,} bytes, {duration:.1f}s)", flush=True)
    print(f"[PASS] Created {OUTPUT_SRT.name} and {OUTPUT_VTT.name} with {len(scenes)} timed captions", flush=True)
    print(f"[PASS] Created poster {OUTPUT_POSTER.name}", flush=True)
    if warnings:
        print("[WARN] Non-fatal scene notes:", flush=True)
        for warning in warnings:
            print(f"  - {warning}", flush=True)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
