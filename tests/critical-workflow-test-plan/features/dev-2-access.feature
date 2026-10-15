@dev2 @access
Feature: Accounts reach the correct workflow and recover from interruptions
  Background:
    Given an isolated preview with a test email sink and synthetic accounts

  @ACC01 @P0 @manual_oauth @browser
  Scenario Outline: A real Google callback completes the intended sign-in branch
    Given <account_state>
    When Google returns <result> through the preview's configured OAuth callback
    Then the application shows <outcome>
    And no unintended second local account is created
    Examples:
      | account_state                                    | result                 | outcome                                |
      | a new Google identity with no local account       | successful consent     | personal-details onboarding            |
      | a registered judge linked to that Google identity | successful consent     | the judge dashboard                    |
      | no signed-in account                             | cancelled consent      | a cancellation message with usable retry |

  @ACC02 @P0 @browser @database
  Scenario: An unverified password account resumes verification when it logs in
    Given a password account has not verified its email and its prior code has expired
    When its owner logs in with the correct password
    Then the application opens verify-email for that address
    And a fresh email-verification code is sent through the test email sink
    And no authenticated session is granted before verification succeeds

  @ACC03 @P0 @browser @database
  Scenario: A judge invitation issued before account creation is claimed on registration
    Given a pending judge-role invitation exists for an address with no account
    And a verified account for that address has subsequently saved all required registration details
    When that account completes registration
    Then the pending role invitation receives an accepted timestamp
    And the account's stored role and refreshed session role are judge
    And the browser reaches /judge without a participant-role redirect loop

  @ACC04 @P1 @browser @fault
  Scenario Outline: An onboarding save failure retains the user's work for retry
    Given an incomplete account is editing <step> with valid changed answers
    And that step's save request will fail before committing
    When the user continues
    Then the page reports the failure without advancing
    And the draft answers remain in the form
    And previously saved registration data is unchanged
    When the save endpoint recovers and the user retries
    Then the changed answers are saved once and the next step opens
    Examples:
      | step             |
      | personal details |
      | food preferences |
      | MLH policies     |

  @ACC05 @P1 @browser @database
  Scenario Outline: Onboarding team URLs reflect actual membership
    Given a verified incomplete account has saved all prerequisite registration details
    And its membership state is <membership>
    When it directly opens <requested_path>
    Then the browser reaches <resolved_path>
    And no new team or membership is created by that navigation
    Examples:
      | membership | requested_path              | resolved_path               |
      | no team    | /onboarding/team/registered  | /onboarding/team            |
      | no team    | /onboarding/team/joined      | /onboarding/team            |
      | owner      | /onboarding/team/register    | /onboarding/team/registered |
      | member     | /onboarding/team/join        | /onboarding/team/joined     |

  @ACC06 @P0 @browser
  Scenario Outline: Logging out prevents the next account from inheriting portal data
    Given <role> account A has viewed private portal data
    When A logs out using <control>
    And a protected URL is requested again with A's old session
    Then the server denies the private request
    When a different account B signs in using the same browser
    Then portal requests and rendered data belong only to B
    And navigation does not restore A's private data from the application cache
    Examples:
      | role        | control           |
      | participant | sidebar user menu |
      | judge       | sidebar user menu |
      | participant | homepage Log out  |

  @ACC07 @P0 @browser @database
  Scenario: Expired authentication cannot produce a successful profile save
    Given a participant has an open profile form with unsaved changes
    And their server-side session expires
    When they attempt to save those changes
    Then the request is unauthorized and the stored profile remains unchanged
    And no success notification is displayed
    When they sign in again and reopen the profile
    Then the last successfully saved profile is shown
