@dev5 @judge
Feature: Judges can enter and edit scores without losing work
  Background:
    Given an isolated preview has a registered judge with an assignment whose slot has started

  @JUDGE01 @P0 @browser @database
  Scenario Outline: An assigned team's scoring form saves through the real application
    Given the assignment has two main criteria and no sidepot criteria
    When the judge opens that assignment from <entry>
    And selects a score for each criterion while moving through Next and Prev
    Then earlier selections remain selected when revisiting a step
    When the judge submits the completed form
    Then the browser returns to the dashboard after a successful save response
    And a fresh visit to that assignment loads the submitted values from the database
    Examples:
      | entry              |
      | the judge dashboard |
      | the judge schedule  |

  @JUDGE02 @P0 @browser @current_contract
  Scenario: The scoring form distinguishes an unanswered sidepot from an explicit zero
    Given the assignment has answered main criteria and two unanswered sidepot criteria
    When the judge reaches the sidepot step
    Then submission is disabled and the form explains which sidepots still need scores
    When the judge selects zero for one sidepot
    Then that sidepot is selected but submission remains disabled for the unanswered sidepot
    When the judge selects a score for the remaining sidepot
    Then submission becomes available and its payload includes the explicit zero

  @JUDGE03 @P0 @browser @fault
  Scenario: A failed score save can be retried without losing the draft
    Given all required scores have been selected
    And the next score-save request will fail before committing
    When the judge submits
    Then the form stays open with an error and all selected scores retained
    And the judge is not shown a successful save or redirected to the dashboard
    When the endpoint recovers and the judge retries with rapid repeated clicks
    Then only one save request is issued while that retry is pending
    And successful completion returns the judge to the dashboard

  @JUDGE04 @P0 @browser @fault
  Scenario: A delayed score fetch cannot overwrite a judge's new draft
    Given an existing assignment score response has been delayed
    And the scoring page has rendered the assignment's initially available values
    When the judge changes one value
    And the delayed older score response arrives
    Then the changed draft remains selected
    And submitting sends the changed value rather than the delayed older value

  @JUDGE05 @P0 @browser @database
  Scenario: Editing one saved score preserves the other saved scores
    Given the assignment already has scores saved for every required criterion
    When the judge reopens it and changes exactly one criterion
    And submits the edit
    Then reopening the assignment shows the changed criterion's new value
    And each untouched criterion retains its previously saved value
    And the dashboard reflects the edited saved values after its query invalidation

  @JUDGE06 @P1 @browser
  Scenario: Leaving the first scoring step handles unsaved edits explicitly
    Given the judge has changed a score on the first step without submitting
    When they activate Prev
    Then the "Leave scoring?" confirmation opens
    When they cancel leaving
    Then they remain in the scoring form with the draft intact
    When they activate Prev again and confirm leaving
    Then the dashboard opens and the draft is not persisted

  @JUDGE07 @P1 @browser @accessibility
  Scenario Outline: Judge scoring controls stay reachable on smaller screens
    Given the scoring form contains long criterion names and sidepots
    And the browser viewport is <viewport>
    When the judge navigates the scoring steps using a keyboard or touch
    Then every score option and navigation control can be reached and activated
    And the selected state is programmatically exposed to assistive technology
    And content is not clipped so that scoring requires an unreachable offscreen control
    And opening and closing mobile navigation restores usable focus to the scoring page
    Examples:
      | viewport |
      | 360x800  |
      | 768x1024 |
