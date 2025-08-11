---
allowed-tools: Bash(gh:*), Bash(find:*), Bash(grep:*), Bash(git:*), Bash(ls:*), Bash(mkdir:*), Bash(cp:*), Bash(awk:*), Bash(wc:*), Bash(tr:*), "Bash(./vendor/bin/*)"
auto-approve: true
description: Implement EchoDash integration or feature with comprehensive testing
argument-hint: <issue-number> | <github-issue-url> | "<integration-or-feature-description>"
---

# Implement EchoDash Integration or Feature

Please implement the requested EchoDash integration or feature following this comprehensive workflow using structured XML tags for clarity.

<input>
$ARGUMENTS (can be a GitHub issue ID, URL, or description of integration/feature)
</input>

<project_context>
**EchoDash Plugin**: This workflow is specifically designed for the EchoDash WordPress plugin, which tracks user interactions and sends event data to various platforms. The AI will follow the coding standards from CLAUDE.md and understand the integration patterns established in the includes/integrations/ directory.
</project_context>

<instructions>
## Interactive Setup

**IMPORTANT**: Before starting, check if $ARGUMENTS is empty or just contains whitespace.

If $ARGUMENTS is empty, STOP and ask the user:
<prompt_template>
"What EchoDash integration or feature would you like me to implement? Please provide:
- A GitHub issue number (e.g., 123)  
- A GitHub issue URL (e.g., https://github.com/user/repo/issues/123)
- Or describe the plugin integration or feature you want me to implement (e.g., 'WP Fusion integration', 'MemberPress integration', 'Custom trigger for contact form submissions')"
</prompt_template>

Wait for their response before proceeding.
</instructions>

<setup_steps>
## Setup Steps

<issue_retrieval>
1. **Get issue details** if a GitHub issue is provided:
   - If argument looks like a number: `gh issue view $ARGUMENTS`
   - If argument looks like a URL: `gh issue view <extract-issue-number>`
   - If it's a description: proceed with the description directly
</issue_retrieval>

<integration_research>
2. **Research integration requirements**:
   - Identify the target plugin or service to integrate with
   - Check if similar integrations exist in `includes/integrations/` for reference
   - Look for plugin-specific hooks, actions, and filters documentation
   - Research the plugin's data structure and event system
   - Note any specific triggers or events that need to be tracked
</integration_research>
</setup_steps>

<git_workflow>
## Git Workflow with Worktrees

<worktree_setup>
3. **Create dedicated worktree for this issue**:
   ```bash
   # Create a new worktree WITHIN the project directory for Claude Code compatibility
   BRANCH_NAME="feature/gh-issue-$ISSUE_NUMBER-brief-description"
   WORKTREE_DIR="./worktrees/issue-$ISSUE_NUMBER"
   
   # Create worktrees directory if it doesn't exist
   mkdir -p ./worktrees
   
   # Create worktree from master branch within project directory
   git worktree add "$WORKTREE_DIR" -b "$BRANCH_NAME" master
   
   # Switch to the new worktree (staying within allowed directories)
   cd "$WORKTREE_DIR"
   
   echo "✅ Created worktree at: $WORKTREE_DIR"
   echo "✅ Working on branch: $BRANCH_NAME"
   echo "✅ This allows parallel development without affecting your main workspace"
   echo "✅ Worktree is within project directory for Claude Code compatibility"
   
   # Add worktrees directory to .gitignore if not already present
   if ! grep -q "^worktrees/$" .gitignore 2>/dev/null; then
       echo "worktrees/" >> .gitignore
       echo "✅ Added worktrees/ to .gitignore"
   fi
   ```
   
   <worktree_benefits>
   **Benefits of using worktrees**:
   - Work on multiple issues simultaneously without branch switching
   - Keep your main workspace clean and unaffected
   - Test changes in isolation
   - Maintain separate development environments
   - Compatible with Claude Code's directory restrictions
   - Organized within project structure (`./worktrees/issue-ID/`)
   </worktree_benefits>
</worktree_setup>
</git_workflow>

<implementation_steps>
## Implementation Steps

<requirements_analysis>
4. **Understand the integration requirements** from the issue/description:
   - Identify what events/triggers need to be tracked
   - Determine what data needs to be collected
   - Understand the integration's scope and functionality
</requirements_analysis>

<code_research>
5. **Search for existing integration patterns** using `find` and `grep`:
   - Look at similar integrations in `includes/integrations/`
   - Find the base integration class structure
   - Research plugin-specific hooks and actions
</code_research>

<integration_implementation>
6. **Implement the integration** following EchoDash patterns:
   - Create new integration class extending `EchoDash_Integration`
   - Implement required methods: `setup_triggers()`, `get_icon_url()`, etc.
   - Add appropriate hooks for the target plugin's events
   - Follow EchoDash coding standards (reference CLAUDE.md)
   - Ensure proper error handling and logging
   - Add integration icon if needed
</integration_implementation>
</implementation_steps>

<integration_testing>
## Integration Testing

<functionality_testing>
7. **Test integration functionality**:
   - Verify the integration appears in the EchoDash admin interface
   - Test that triggers are properly set up and configured
   - Ensure events are captured when the target plugin actions occur
   - Validate data collection and processing
</functionality_testing>

<hook_verification>
8. **Verify plugin hooks and compatibility**:
   - Test with different versions of the target plugin if possible
   - Ensure hooks are attached at the right priority
   - Verify no conflicts with existing functionality
   - Test edge cases and error conditions
</hook_verification>
</integration_testing>

<completion>
## Completion

<final_documentation>
9. **Document the integration**:
    - Verify integration is properly registered and appears in admin
    - Test trigger functionality in typical use cases
    - Confirm all required methods are implemented
</final_documentation>

<review_and_commit>
10. **Review integration code**:
    - Ensure coding standards are followed
    - Verify proper error handling is in place
    - Confirm all hooks are properly attached

11. **Confirm the integration works** as intended
</review_and_commit>

<git_commit_and_pr>
12. **Commit changes with descriptive message**:
    <commit_requirements>
    - Reference the GitHub issue number
    - Describe what integration/feature was implemented
    - Include any breaking changes
    - Include any areas that might need human testing
    - Include any plugin compatibility requirements
    </commit_requirements>

13. **Create Pull Request**:
    ```bash
    gh pr create --title "Integration: [Plugin name] integration (Issue #$ISSUE_NUMBER)" \
                 --body "## Summary
    Implements [plugin name] integration requested in GitHub issue #$ISSUE_NUMBER
    
    ## Changes
    - [List integration features added]
    - [List triggers and events tracked]
    
    ## Testing
    - [Describe integration testing performed]
    - [List plugin compatibility verified]

    ## Plugin Requirements
    - [List required plugin versions or dependencies]

    ## Areas for Human Testing
    - [List areas that might need human testing with the target plugin]

    ## Documentation
    - [Note any user documentation that might be needed]
    
    🤖 Generated with Claude Code for EchoDash"
    ```

14. **Clean up worktree automatically**:
    ```bash
    # Return to main workspace
    cd ../../
    
    # Remove the worktree (frees up the branch for normal Git workflow)
    git worktree remove "./worktrees/issue-$ISSUE_NUMBER"
    
    echo "✅ Worktree cleaned up - you can now use normal Git workflow for PR revisions"
    echo "💡 To make changes: git checkout feature/gh-issue-$ISSUE_NUMBER-brief-description"
    ```

15. **Document any integration requirements** or plugin dependencies
</git_commit_and_pr>


</completion>

<implementation_notes>
## Implementation Notes

<guidelines>
- Follow EchoDash coding standards (reference CLAUDE.md)
- All integrations should extend the `EchoDash_Integration` base class
- Integration files should be placed in `includes/integrations/[plugin-name]/`
- Include an icon file (PNG format) for the integration
- Use proper WordPress hooks and filters with appropriate priorities
- Implement proper error handling and logging
- Test compatibility with different plugin versions when possible
- Leverage worktrees for parallel development without disrupting your main workspace
- Follow WordPress coding standards for PHP
- Use the `echodash-` prefix for CSS classes and HTML elements
</guidelines>
</implementation_notes>