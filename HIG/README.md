# Headquarters Implementation Guide (HIG)

Version: HIG v0.1  
Status: Active  
Classification: Implementation Control  
Owner: Engineering / Founder

## Purpose

The Headquarters Implementation Guide translates the frozen design repository (HDR) and the technical blueprint (HTB) into executable engineering tasks.

The HIG exists to prevent Codex or any developer from attempting to build Headquarters in one uncontrolled pass.

## Core Rule

Codex must not build the entire product at once.

All implementation work must be divided into small engineering tasks designed to take approximately **2-4 hours** each. At the end of each task, Codex must stop, summarize what changed, provide verification steps, and wait for explicit approval before continuing.

## Source-of-Truth Chain

HDR defines what Headquarters is.  
HTB defines how Headquarters is structured.  
HIG defines what Codex builds next.

## Required Engineering Loop

1. Select one approved task from the HIG backlog.
2. Confirm referenced HDR and HTB files.
3. Implement only the requested scope.
4. Run the relevant checks.
5. Summarize changed files.
6. State known limitations.
7. Wait for approval.

No task may silently expand into a larger build.
