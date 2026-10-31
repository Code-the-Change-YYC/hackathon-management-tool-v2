@dev2 @access
Feature: Accounts reach the correct workflow and recover from interruptions
  Background:
    Given an isolated preview with a test email sink and synthetic accounts

  @ACC02 @P0 @browser @database
  Scenario: An unverified password account resumes verification when it logs in
    Given a password account has not verified its email and its prior code has expired
    When its owner logs in with the correct password
    Then the application opens verify-email for that address
    And a fresh email-verification code is sent through the test email sink
    And no authenticated session is granted before verification succeeds

  # Pending team decision: create judge accounts before the hackathon or support
  # judge account creation through signup. This invitation scenario describes
  # the existing implementation; confirm the intended flow before adopting it
  # as an acceptance requirement or adding it to a Jira testing ticket.
  @ACC03 @P0 @browser @database @pending_decision
  Scenario: A judge invitation issued before account creation is claimed on registration
    Given a pending judge-role invitation exists for an address with no account
    And a verified account for that address has subsequently saved all required registration details
    When that account completes registration
    Then the pending role invitation receives an accepted timestamp
    And the account's stored role and refreshed session role are judge
    And the browser reaches /judge without a participant-role redirect loop
