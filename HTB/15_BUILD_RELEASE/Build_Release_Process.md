# Build and Release Process

    **Owner:** Release Engineering  
    **Status:** Engineering Blueprint  
    **Baseline:** HDR v1.0 Design Freeze  
    **Purpose:** Convert the locked Headquarters design into buildable implementation guidance.

    ---


Initial release process:

1. Run lint/typecheck.
2. Run tests.
3. Validate database migrations.
4. Run UX journey smoke test.
5. Build desktop app.
6. Generate release notes.
7. Tag release.

Version naming should preserve institutional language.
Example:
- HDR v1.0 Design Freeze
- HTB v0.1 Technical Blueprint
- App v0.1 Command Shell


    ---

    ## Acceptance Criteria

    - The implementation can be traced back to HDR v1.0.
    - No new product philosophy is introduced here.
    - The document gives Codex/developers actionable engineering direction.
    - Any unresolved item is marked as an implementation decision, not hidden.
