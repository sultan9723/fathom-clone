"""Which origins may call the API.

The regex cases matter most: a loose preview pattern is a silent hole, since
allow_credentials is on and a matching origin can read responses from a
logged-in browser.
"""

import re

import pytest

import cors


# --- The explicit list -------------------------------------------------------

def test_origins_come_from_the_environment(monkeypatch):
    monkeypatch.setenv("CORS_ORIGINS", "https://noteai.example.com,https://www.example.com")

    assert cors.allowed_origins() == ["https://noteai.example.com", "https://www.example.com"]


def test_whitespace_and_trailing_slashes_are_trimmed(monkeypatch):
    # A trailing slash never matches: browsers send the origin without one.
    monkeypatch.setenv("CORS_ORIGINS", "  https://a.example.com/ , https://b.example.com  ")

    assert cors.allowed_origins() == ["https://a.example.com", "https://b.example.com"]


def test_an_unset_value_falls_back_to_localhost(monkeypatch):
    monkeypatch.delenv("CORS_ORIGINS", raising=False)

    assert cors.allowed_origins() == ["http://localhost:3000", "http://127.0.0.1:3000"]


def test_a_blank_value_falls_back_rather_than_allowing_nothing(monkeypatch):
    monkeypatch.setenv("CORS_ORIGINS", "   ")

    assert cors.allowed_origins() == ["http://localhost:3000", "http://127.0.0.1:3000"]


def test_no_wildcard_is_ever_produced(monkeypatch):
    monkeypatch.setenv("CORS_ORIGINS", "https://noteai.example.com")

    assert "*" not in cors.allowed_origins()


# --- The preview regex -------------------------------------------------------

@pytest.fixture
def preview(monkeypatch):
    monkeypatch.setenv("VERCEL_PROJECT", "noteai-web")
    monkeypatch.setenv("VERCEL_SCOPE", "sultan9723")
    pattern = cors.preview_origin_regex()
    assert pattern is not None
    return re.compile(pattern)


@pytest.mark.parametrize(
    "origin",
    [
        "https://noteai-web-abc123-sultan9723.vercel.app",
        "https://noteai-web-git-feature-branch-sultan9723.vercel.app",
        "https://noteai-web-git-v2-integrate-sultan9723.vercel.app",
    ],
)
def test_this_projects_previews_are_allowed(preview, origin):
    assert preview.match(origin)


@pytest.mark.parametrize(
    "origin",
    [
        # Another account's deployment of a same-named project.
        "https://noteai-web-abc123-someoneelse.vercel.app",
        # A different project under our own account.
        "https://other-project-abc123-sultan9723.vercel.app",
        # Our project name embedded in someone else's hostname.
        "https://evil-noteai-web-abc123-sultan9723.vercel.app",
        # A lookalike domain.
        "https://noteai-web-abc123-sultan9723.vercel.app.attacker.com",
        # Plain http, not the https Vercel serves.
        "http://noteai-web-abc123-sultan9723.vercel.app",
        # Anything at all.
        "https://attacker.example.com",
    ],
)
def test_other_origins_are_refused(preview, origin):
    assert preview.match(origin) is None


def test_a_suffix_after_the_domain_cannot_slip_through(preview):
    # The pattern is anchored at both ends, so no path or extra label matches.
    assert preview.match("https://noteai-web-abc-sultan9723.vercel.app/evil") is None


def test_no_regex_without_both_project_and_scope(monkeypatch):
    # A half-configured deployment gets no preview access rather than a loose
    # pattern that might match more than intended.
    monkeypatch.setenv("VERCEL_PROJECT", "noteai-web")
    monkeypatch.delenv("VERCEL_SCOPE", raising=False)
    assert cors.preview_origin_regex() is None

    monkeypatch.delenv("VERCEL_PROJECT", raising=False)
    monkeypatch.setenv("VERCEL_SCOPE", "sultan9723")
    assert cors.preview_origin_regex() is None


def test_no_regex_when_neither_is_set(monkeypatch):
    monkeypatch.delenv("VERCEL_PROJECT", raising=False)
    monkeypatch.delenv("VERCEL_SCOPE", raising=False)

    assert cors.preview_origin_regex() is None


def test_regex_metacharacters_in_the_project_name_are_escaped(monkeypatch):
    monkeypatch.setenv("VERCEL_PROJECT", "note.ai")
    monkeypatch.setenv("VERCEL_SCOPE", "team")
    pattern = re.compile(cors.preview_origin_regex())

    # The dot must be a literal, not "any character".
    assert pattern.match("https://note.ai-abc-team.vercel.app")
    assert pattern.match("https://noteXai-abc-team.vercel.app") is None
