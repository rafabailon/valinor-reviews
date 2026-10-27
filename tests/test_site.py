"""Static checks for the bilingual Valinor Reviews site."""

from __future__ import annotations

from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urlsplit
import json
import re
import unittest


ROOT = Path(__file__).resolve().parents[1]
LANGUAGES = ("en", "es")
PAGES = (ROOT / "index.html", *sorted((ROOT / "en").glob("*.html")), *sorted((ROOT / "es").glob("*.html")))
EXPECTED_PAGES = {"index.html", "reviews.html", "review.html", "reading-list.html", "about.html", "shelf.html"}
NAV_PAGES = ("reviews.html", "reading-list.html", "about.html", "shelf.html")
REVIEW_FIELDS = {
    "id", "title", "author", "category", "score", "date", "image",
    "alt", "excerpt", "body", "verdict", "details", "tags",
}


class PageInspector(HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self.lang = ""
        self.title = ""
        self.meta_names: set[str] = set()
        self.meta_content: dict[str, str] = {}
        self.ids: list[str] = []
        self.links: list[str] = []
        self.resources: list[str] = []
        self.scripts: list[str] = []
        self.images: list[dict[str, str | None]] = []
        self.tags: dict[str, int] = {}
        self.body_data_page = ""
        self._in_title = False

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        attributes = dict(attrs)
        self.tags[tag] = self.tags.get(tag, 0) + 1
        if tag == "html":
            self.lang = attributes.get("lang", "") or ""
        elif tag == "title":
            self._in_title = True
        elif tag == "body":
            self.body_data_page = attributes.get("data-page", "") or ""
        elif tag == "img":
            self.images.append({
                "src": attributes.get("src"),
                "alt": attributes.get("alt"),
                "loading": attributes.get("loading"),
            })
        if tag == "meta" and attributes.get("name"):
            name = attributes["name"] or ""
            self.meta_names.add(name)
            self.meta_content[name] = attributes.get("content", "") or ""
        if attributes.get("id"):
            self.ids.append(attributes["id"] or "")
        if tag == "a" and attributes.get("href"):
            self.links.append(attributes["href"] or "")
        if tag == "script" and attributes.get("src"):
            self.scripts.append(attributes["src"] or "")
        for attribute in ("src", "href"):
            value = attributes.get(attribute)
            if value and (
                attribute == "src"
                or (tag == "link" and attributes.get("rel") in {"stylesheet", "icon"})
            ):
                self.resources.append(value)

    def handle_endtag(self, tag: str) -> None:
        if tag == "title":
            self._in_title = False

    def handle_data(self, data: str) -> None:
        if self._in_title:
            self.title += data.strip()


def inspect_page(path: Path) -> PageInspector:
    parser = PageInspector()
    parser.feed(path.read_text(encoding="utf-8"))
    return parser


def load_reviews(language: str) -> list[dict[str, object]]:
    source = (ROOT / f"assets/js/reviews.{language}.js").read_text(encoding="utf-8")
    payload = source.split("=", 1)[1].strip().rstrip(";")
    return json.loads(payload)


class StaticSiteTests(unittest.TestCase):
    def test_all_pages_have_language_metadata_and_main_landmark(self) -> None:
        for page in PAGES:
            with self.subTest(page=page.relative_to(ROOT)):
                inspector = inspect_page(page)
                expected_language = page.parent.name if page.parent.name in LANGUAGES else "es"
                self.assertEqual(inspector.lang, expected_language)
                self.assertTrue(inspector.title)
                self.assertIn("Valinor Reviews", inspector.title)
                self.assertIn("viewport", inspector.meta_names)
                self.assertIn("description", inspector.meta_names)
                self.assertIn("theme-color", inspector.meta_names)
                self.assertGreaterEqual(len(inspector.meta_content["description"]), 50)
                self.assertEqual(inspector.tags.get("main"), 1)

    def test_pages_have_unique_ids_and_a_working_skip_link(self) -> None:
        for page in PAGES:
            with self.subTest(page=page.relative_to(ROOT)):
                inspector = inspect_page(page)
                self.assertEqual(len(inspector.ids), len(set(inspector.ids)), "Duplicate id attribute")
                text = page.read_text(encoding="utf-8")
                self.assertIn('class="skip-link"', text)
                match = re.search(r'<a class="skip-link" href="#([^"]+)"', text)
                self.assertIsNotNone(match)
                self.assertIn(match.group(1), inspector.ids)
                self.assertRegex(text, r'<main[^>]*\bid="(?:main-content|review-detail)"[^>]*\btabindex="-1"')

    def test_local_links_and_assets_resolve(self) -> None:
        for page in PAGES:
            inspector = inspect_page(page)
            for reference in (*inspector.links, *inspector.resources, *inspector.scripts):
                parsed = urlsplit(reference)
                if parsed.scheme or parsed.netloc or reference.startswith("data:"):
                    continue
                target = (page.parent / unquote(parsed.path)).resolve() if parsed.path else page
                if target.is_dir():
                    target = target / "index.html"
                with self.subTest(page=page.relative_to(ROOT), reference=reference):
                    self.assertTrue(target.is_file(), f"Missing local target: {reference}")
                    if parsed.fragment and target.suffix == ".html":
                        self.assertIn(
                            unquote(parsed.fragment),
                            inspect_page(target).ids,
                            f"Missing anchor in {target}: {parsed.fragment}",
                        )

    def test_language_pages_are_complete_pairs(self) -> None:
        english = {page.name for page in (ROOT / "en").glob("*.html")}
        spanish = {page.name for page in (ROOT / "es").glob("*.html")}
        self.assertEqual(english, spanish)
        self.assertEqual(english, EXPECTED_PAGES)

    def test_navigation_is_consistent_across_languages(self) -> None:
        javascript = (ROOT / "assets/js/site.js").read_text(encoding="utf-8")
        self.assertIn('languageLink.className = "language-switch"', javascript)
        for language in LANGUAGES:
            for page in sorted((ROOT / language).glob("*.html")):
                text = page.read_text(encoding="utf-8")
                with self.subTest(language=language, page=page.name):
                    self.assertIn('id="site-nav"', text)
                    if page.name == "review.html":
                        self.assertIn('id="review-detail"', text)
                    else:
                        self.assertIn('id="main-content"', text)
                    for target in NAV_PAGES:
                        self.assertIn(f'href="{target}"', text)
                    self.assertIn('data-nav="shelf"', text)
                    self.assertIn('class="nav-cta"', text)

    def test_review_controls_and_dynamic_detail_mount_point_exist(self) -> None:
        for language in LANGUAGES:
            archive = (ROOT / language / "reviews.html").read_text(encoding="utf-8")
            detail = (ROOT / language / "review.html").read_text(encoding="utf-8")
            with self.subTest(language=language):
                for marker in ('id="review-search"', 'id="genre-filter"', 'id="review-sort"', 'id="all-reviews"', 'id="random-review"'):
                    self.assertIn(marker, archive)
                self.assertIn('id="review-detail"', detail)
                self.assertIn('aria-live="polite"', detail)
                self.assertIn('id="library-empty"', archive)

    def test_shelf_feature_is_wired_end_to_end(self) -> None:
        javascript = (ROOT / "assets/js/site.js").read_text(encoding="utf-8")
        for marker in ('SHELF_KEY = "valinor-reviews:shelf"', "localStorage", "storage", "data-shelf-id", "aria-pressed", "shelfPage"):
            self.assertIn(marker, javascript)
        for language in LANGUAGES:
            shelf = (ROOT / language / "shelf.html").read_text(encoding="utf-8")
            with self.subTest(language=language):
                for marker in ('id="shelf-reviews"', 'id="shelf-empty"', 'id="shelf-count"', 'data-page="shelf"'):
                    self.assertIn(marker, shelf)
                self.assertIn('data-nav="shelf"', shelf)

    def test_styles_support_small_screens_reduced_motion_and_new_controls(self) -> None:
        stylesheet = (ROOT / "assets/css/site.css").read_text(encoding="utf-8")
        for marker in (
            "@media (max-width: 700px)",
            "@media (max-width: 420px)",
            "@media (prefers-reduced-motion: reduce)",
            ".skip-link",
            ".shelf-toggle",
            ".shelf-action",
            ".library-toolbar",
            ".page-hero-shelf",
        ):
            with self.subTest(marker=marker):
                self.assertIn(marker, stylesheet)

    def test_review_data_is_valid_and_bilingual(self) -> None:
        english = load_reviews("en")
        spanish = load_reviews("es")
        self.assertEqual(len(english), len(spanish))
        self.assertGreaterEqual(len(english), 4)

        english_by_id = {review["id"]: review for review in english}
        spanish_by_id = {review["id"]: review for review in spanish}
        self.assertEqual(set(english_by_id), set(spanish_by_id))

        for language, reviews in (("en", english), ("es", spanish)):
            with self.subTest(language=language):
                self.assertEqual(len({review["id"] for review in reviews}), len(reviews))
                for review in reviews:
                    self.assertEqual(set(review), REVIEW_FIELDS)
                    for field in REVIEW_FIELDS - {"score", "tags"}:
                        self.assertIsInstance(review[field], str)
                        self.assertTrue(review[field].strip(), f"Empty {field} in {review['id']}")
                    self.assertIsInstance(review["score"], int)
                    self.assertGreaterEqual(review["score"], 0)
                    self.assertLessEqual(review["score"], 100)
                    self.assertTrue(review["image"].startswith("https://images.unsplash.com/"))
                    self.assertGreaterEqual(len(review["tags"]), 2)
                    self.assertEqual(len(review["tags"]), len(set(review["tags"])))
                    self.assertTrue(all(tag.strip() for tag in review["tags"]))

        for review_id in english_by_id:
            with self.subTest(review=review_id):
                self.assertEqual(english_by_id[review_id]["score"], spanish_by_id[review_id]["score"])
                self.assertEqual(english_by_id[review_id]["image"], spanish_by_id[review_id]["image"])
                self.assertEqual(english_by_id[review_id]["author"], spanish_by_id[review_id]["author"])

    def test_images_have_alt_text(self) -> None:
        for page in PAGES:
            for image in inspect_page(page).images:
                with self.subTest(page=page.relative_to(ROOT), image=image["src"]):
                    self.assertTrue(image["alt"], "Missing alt text")
        for language in LANGUAGES:
            for review in load_reviews(language):
                with self.subTest(language=language, review=review["id"]):
                    self.assertTrue(review["alt"])

    def test_javascript_copy_keys_and_escaping_are_complete(self) -> None:
        javascript = (ROOT / "assets/js/site.js").read_text(encoding="utf-8")
        copy_block = javascript[javascript.index("const copy ="):javascript.index("const leafIcon")]
        spanish_block = copy_block.split("? {", 1)[1].split("} : {", 1)[0]
        english_block = copy_block.split("} : {", 1)[1].split("};", 1)[0]
        key_pattern = re.compile(r"^\s{4}([A-Za-z]+):", re.MULTILINE)
        spanish_keys = set(key_pattern.findall(spanish_block))
        english_keys = set(key_pattern.findall(english_block))
        used_keys = set(re.findall(r"\bcopy\.([A-Za-z]+)", javascript))
        self.assertEqual(spanish_keys, english_keys)
        self.assertEqual(used_keys - spanish_keys, set())

        for field in ("title", "author", "category", "excerpt", "body", "verdict", "details", "image", "alt"):
            with self.subTest(field=field):
                self.assertIn(f"escapeHTML(review.{field})", javascript)
        self.assertIn("encodeURIComponent(review.id)", javascript)

    def test_no_unused_tailwind_cdn_dependency(self) -> None:
        for page in PAGES:
            with self.subTest(page=page.relative_to(ROOT)):
                self.assertNotIn("cdn.tailwindcss.com", page.read_text(encoding="utf-8"))

    def test_documentation_matches_project_name(self) -> None:
        readme = (ROOT / "README.md").read_text(encoding="utf-8")
        self.assertIn("Valinor Reviews", readme)
        self.assertIn("shelf.html", readme)
        self.assertIn("make test", readme)


if __name__ == "__main__":
    unittest.main()
