@dev6 @judge @integrity
Feature: Scoring APIs preserve valid scores and participant results under traffic
  Background:
    Given isolated PostgreSQL data with two rounds, multiple teams, and assigned judges

  @SCORE01 @P0 @integration
  Scenario Outline: Invalid score batches cannot partially alter saved scores
    Given an authorized assigned judge and a snapshot of the current score rows
    When the judge submits a batch containing <invalid_input>
    Then the API rejects the batch with BAD_REQUEST
    And every score row still matches the snapshot
    Examples:
      | invalid_input                                      |
      | no score items                                     |
      | items from two different assignments               |
      | a negative score                                   |
      | a fractional score                                 |
      | a score above the criterion's configured maximum    |
      | a nonexistent criterion alongside an otherwise valid item |

  @SCORE02 @P0 @integration
  Scenario Outline: The alternate score-update endpoint preserves scoring restrictions
    Given the caller owns a score with a configured maximum of ten
    When <caller> directly calls scores.update with <value>
    Then the request is rejected with <error>
    And the saved score remains unchanged
    Examples:
      | caller                                      | value | error       |
      | a judge who is not assigned to that room     | 5     | FORBIDDEN   |
      | a judge who is assigned to that room         | 11    | BAD_REQUEST |

  @SCORE03 @P0 @integration @concurrency
  Scenario: Replaying a saved score batch cannot multiply stored scores
    Given a valid score batch has already been acknowledged as saved
    When two identical retries of that same batch arrive simultaneously
    Then both retries complete without creating extra score rows
    And exactly one row exists per judge, assignment, and criterion
    And the saved values equal the acknowledged batch

  @SCORE04 @P0 @integration @concurrency @current_contract
  Scenario: Two assigned judges retain independent complete score batches
    Given two judges share the same room assignment
    And each has a different complete score batch for the same criteria
    When the two batches are submitted concurrently
    Then each judge's stored batch equals their own complete submitted batch
    And no judge, assignment, and criterion has duplicate score rows
    And a fresh read from each judge session returns only that judge's stored batch

  @SCORE05 @P0 @integration @database
  Scenario: Released result averages are calculated from actual persisted assignments
    Given winners have been announced
    And team A has two assignments in Round 1 with criterion scores six and nine
    And team A has a Round 2 assignment with a score of four for the same criterion
    And team B has a Round 1 assignment with a score of ten
    When a team A participant requests released results through the real scores query
    Then Round 1 returns seven point five for that criterion
    And Round 2 returns four for that criterion
    And team B's score does not enter either average
    And the values are calculated by PostgreSQL rather than supplied by a mocked response

  @SCORE06 @P0 @integration
  Scenario Outline: Public and participant sessions cannot use judge score endpoints
    Given the caller has <session>
    When it directly requests <endpoint> with otherwise valid identifiers
    Then the API returns <error> without score data or score changes
    Examples:
      | session                 | endpoint                  | error        |
      | no authenticated session | scores.getAll            | UNAUTHORIZED |
      | a participant session    | scores.getAll            | FORBIDDEN    |
      | a participant session    | scores.getByAssignment   | FORBIDDEN    |
      | a participant session    | scores.getByTeam         | FORBIDDEN    |
      | a participant session    | scores.getByRound        | FORBIDDEN    |
      | a participant session    | scores.getAggregatedByTeam | FORBIDDEN  |
      | a participant session    | scores.createMany        | FORBIDDEN    |
      | a participant session    | scores.update            | FORBIDDEN    |
