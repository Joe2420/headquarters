# Code Review Rules

## Review Objective

Code review verifies that implementation matches HDR, HTB, HIG, and HDC.

Review is not only about bugs. It is about protecting the institution.

## Review Checklist

- Does the code implement the assigned task only?
- Does it obey package boundaries?
- Does it route behavior through HQOS where required?
- Does it avoid direct UI database access?
- Does it preserve institutional language?
- Does it include appropriate tests?
- Does it avoid hidden global state?
- Does it maintain buildability?
- Does it update documentation when needed?
- Does it avoid architectural invention?

## Pull Request Rule

One task equals one pull request or one reviewable change set.

No bundled unrelated changes.

## Review Result

- Approved
- Approved with changes
- Rejected
- Requires ACR
