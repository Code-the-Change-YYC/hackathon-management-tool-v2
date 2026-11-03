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
