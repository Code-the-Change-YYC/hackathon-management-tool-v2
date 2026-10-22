@dev4 @participant
Feature: Participants receive current event information and reliable personal updates
  Background:
    Given an isolated preview with a registered participant and controlled server data

  @PART01 @P0 @browser @database
  Scenario: A schedule already open in the browser receives a server-side change
    Given a participant has opened the schedule containing an active event
    When the event's title, location, and navigation URL are changed on the server
    Then the visible schedule displays those changes within 45 seconds without a manual reload
    When the event is changed from active to draft
    Then the next successful refresh removes it from the schedule
    And the participant dashboard also removes it after its next successful refresh

  @PART02 @P0 @browser @database
  Scenario: A round change refreshes the participant's actual judging assignment
    Given team A and team B have different assignments in two rounds
    And a team A participant has the dashboard and judging page open
    When the server advances the active round and updates team A's room and time slot
    Then the dashboard and judging page show the new round within 45 seconds
    And the judging page shows team A's new room, time, and meeting destination
    And no team B assignment appears in team A's response or page

  @PART03 @P1 @browser @fault
  Scenario: Auto-refresh preserves a loaded page while the connection is unavailable
    Given a participant has a loaded schedule
    When the browser goes offline for two refresh intervals
    Then the loaded schedule remains readable and no page refresh is attempted
    When the browser is online but the connectivity probe fails
    Then no page refresh is attempted
    When the server recovers and an online or visible-tab event occurs
    Then one refresh retrieves the latest event data
    And overlapping triggers do not create concurrent connectivity checks

  @PART04 @P1 @browser
  Scenario: Resource visibility and direct access open together when the event starts
    Given the configured start time is in the future
    When a participant opens the navigation and requests /participant/resources directly
    Then the Resources item is absent and the direct request redirects to /participant
    When the server clock reaches the configured start time
    And the participant performs a fresh navigation
    Then Resources appears and /participant/resources is accessible
    And the Discord and Devpost quick links open the configured event destinations

  @PART05 @P1 @browser @database
  Scenario Outline: Saved profile changes reach other views without changing another account
    Given participant A and participant B have different saved profiles
    When A saves <change> through the profile interface
    Then A's profile and <dependent_view> display the saved value after refresh
    And the value survives signing out and back in
    And B's stored profile remains unchanged
    Examples:
      | change                         | dependent_view              |
      | a different first and last name | the sidebar name            |
      | a different allowed avatar      | the sidebar and team avatar |

  @PART06 @P1 @browser @fault
  Scenario Outline: A failed personal update keeps its draft available to retry or cancel
    Given a participant has changed <editor> without saving
    And its save request will fail before committing
    When they save
    Then an error appears and the editor retains the changed values
    And the stored values remain unchanged
    When they cancel and reopen that editor
    Then the original saved values are restored
    Examples:
      | editor                    |
      | the personal-details form |
      | the avatar picker         |

  @PART07 @P0 @integration @concurrency
  Scenario: Two scanners redeem the same current meal ticket simultaneously
    Given a participant has an unused valid ticket for a currently active meal
    And two authorized scanner sessions submit the same token for the same meal
    When those redemption requests are released simultaneously
    Then exactly one request succeeds
    And the other returns an already-checked-in conflict
    And exactly one attendance record exists for that participant and meal
