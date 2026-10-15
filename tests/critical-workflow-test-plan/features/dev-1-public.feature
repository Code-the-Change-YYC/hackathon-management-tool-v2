@dev1 @public
Feature: Public information and email verification remain usable
  Background:
    Given an isolated production-mode preview with synthetic accounts

  @PUB01 @P0 @browser @database @issue124
  Scenario: Published judging criteria reach an anonymous visitor
    Given the preview database contains the approved judging criteria and descriptions
    And the homepage cache has been regenerated against that database
    When a signed-out visitor opens the homepage and follows the judging criteria section
    Then every configured criterion name and description is displayed
    And the unavailable message is absent
    And no sign-in is required to read the criteria

  @PUB02 @P1 @browser @fault
  Scenario Outline: An unavailable criteria section recovers after the data source recovers
    Given the homepage criteria query encounters <failure>
    When an anonymous visitor opens a freshly rendered homepage
    Then the criteria section displays "Judging criteria are currently unavailable."
    And the signup and login entry points remain usable
    When the criteria query is restored to return published data
    And a new homepage render is completed after the configured cache revalidation
    Then a fresh anonymous request displays the restored criteria
    Examples:
      | failure                     |
      | an empty criteria table     |
      | a database connection error |

  @PUB03 @P1 @browser @accessibility
  Scenario: A visitor discovers the rubric through the FAQ using a keyboard
    Given a signed-out visitor is using a narrow screen with published criteria
    When they expand "How are the winners selected?" using the keyboard
    And activate the "judging criteria" link
    Then the judging criteria section is reached
    And its heading and first criterion can be read without the fixed header obscuring them
    And keyboard focus remains usable for continuing through the page

  @PUB04 @P1 @browser
  Scenario Outline: Homepage entry actions use the current session
    Given the homepage is opened with <session>
    When the visitor activates <action>
    Then they arrive at <destination>
    And the page does not use a previous account's dashboard destination
    Examples:
      | session                          | action                | destination  |
      | no signed-in account             | header Join Hackathon | /signup      |
      | no signed-in account             | hero Join Hackathon   | /signup      |
      | no signed-in account             | header Log in         | /login       |
      | a fully registered participant   | hero Dashboard        | /participant |
      | a fully registered judge         | header Dashboard      | /judge       |

  @PUB05 @P0 @browser @database
  Scenario Outline: Repeating signup cannot replace an existing account's password
    Given an account already exists with <verification> email verification
    When a signed-out visitor signs up with that email and a different valid password
    Then the signup response does not disclose whether the account existed
    And no second account is created
    And the stored password is not replaced
    And the account owner receives <notice> through the test email sink
    Examples:
      | verification | notice                                      |
      | completed    | the existing-account login notice           |
      | incomplete   | the unfinished-signup notice with a new code |

  @PUB06 @P0 @browser @database
  Scenario Outline: Email verification can recover from an unusable code
    Given an unverified account has an email-verification code
    And that code is unusable because of <cause>
    When the user submits that code on the verify-email page
    Then no authenticated session is created
    And the page explains that a fresh code is needed
    When the user requests a replacement verification code
    And verifies with the newly issued code
    Then that same account becomes verified and receives a session
    And the previous code cannot be reused
    Examples:
      | cause                        |
      | expiry after ten minutes     |
      | three incorrect code guesses |

  @PUB07 @P1 @load @production_build
  Scenario: A public traffic burst preserves criteria availability and signup access
    Given the published criteria exist and the public-load profile in the plan is configured
    When anonymous traffic exercises cold and warm homepage renders and opens signup
    Then successful homepage renders include the published criteria
    And the agreed page-latency and error-rate budgets are met
    And the database pool recovers after the burst without sustained connection exhaustion
