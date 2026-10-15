@dev3 @participant @teams
Feature: Team membership remains correct during busy registration periods
  Background:
    Given isolated PostgreSQL data and registered synthetic participants

  @TEAM01 @P0 @integration @concurrency
  Scenario: Two participants compete for the final team place
    Given a team contains four members
    And two participants without teams have its valid invite code
    When their join requests are released simultaneously
    Then exactly one request succeeds and one reports that the team is full
    And the team has exactly five members
    And the rejected participant still has no team

  @TEAM02 @P0 @integration @concurrency
  Scenario: One participant cannot join two teams through concurrent requests
    Given a participant has no team and two teams have available places
    When that participant submits simultaneous join requests for the two teams
    Then exactly one membership is committed for that participant
    And the other request reports the existing membership
    And both teams' persisted member counts remain consistent

  @TEAM03 @P1 @browser @database
  Scenario: A full-team error leaves the participant able to choose another team
    Given a participant without a team has a valid code for a five-member team
    When they submit that code in the participant join dialog
    Then the dialog explains the five-member limit without showing a joined-success screen
    And the full team's membership is unchanged
    And the participant can return to the team choices without refreshing the browser

  @TEAM04 @P0 @integration
  Scenario Outline: A crafted rename request cannot bypass team ownership
    Given a target team has a saved name
    And the caller is <caller>
    When the caller directly requests a name change for that target team's ID
    Then the API returns FORBIDDEN
    And the target team's saved name remains unchanged
    Examples:
      | caller                         |
      | a non-owner member of the team |
      | the owner of a different team  |

  @TEAM05 @P0 @integration
  Scenario Outline: Team ownership does not grant admin-only team changes
    Given a participant owns a team
    When they directly submit a team update containing <field>
    Then the API returns FORBIDDEN
    And none of the requested changes are committed
    Examples:
      | field                           |
      | metadata with a Devpost link     |
      | slug                            |
      | logo                            |
      | a name together with metadata   |

  @TEAM06 @P0 @integration @fault
  Scenario: A failed team registration cannot leave an orphan team
    Given a participant without a team requests team creation
    And an injected failure occurs after inserting the organization but before inserting its owner
    When the transaction fails
    Then neither the new organization nor its membership is committed
    And a subsequent creation attempt succeeds after the failure is removed
    And that successful team has exactly one owner membership

  @TEAM07 @P0 @integration @concurrency
  Scenario: Simultaneous departures leave the surviving member as owner
    Given a team contains an owner and two other members
    When the owner and one other member leave simultaneously
    Then both departing memberships are removed
    And the surviving member is the sole owner
    And the surviving team and its invite code remain usable
