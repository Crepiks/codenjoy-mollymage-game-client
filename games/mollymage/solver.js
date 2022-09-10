/*-
 * #%L
 * Codenjoy - it's a dojo-like platform from developers to developers.
 * %%
 * Copyright (C) 2012 - 2022 Codenjoy
 * %%
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public
 * License along with this program.  If not, see
 * <http://www.gnu.org/licenses/gpl-3.0.html>.
 * #L%
 */

const Directions = {
  UP: 0,
  RIGHT: 1,
  DOWN: 2,
  LEFT: 3,
};

let nextDirection = getRandomDirection();

function getRandomDirection() {
  return Math.floor(Math.random() * 4);
}

var MollymageSolver = (module.exports = {
  get: function (board) {
    /**
     * @return next hero action
     */

    var Games = require("./../../engine/games.js");
    var Point = require("./../../engine/point.js");
    var Direction = Games.require("./direction.js");
    var Element = Games.require("./elements.js");
    var Stuff = require("./../../engine/stuff.js");

    function getLocationFromDirection(heroX, heroY, direction) {
      switch (direction) {
        case Directions.UP:
          return { x: heroX, y: heroY + 1 };
        case Directions.RIGHT:
          return { x: heroX + 1, y: heroY };
        case Directions.DOWN:
          return { x: heroX, y: heroY - 1 };
        case Directions.LEFT:
          return { x: heroX - 1, y: heroY };
      }
    }

    function canMoveTo(x, y) {
      return (
        board.isAnyOfAt(x, y, [
          Element.NONE,
          Element.POTION_BLAST_RADIUS_INCREASE,
          Element.POTION_COUNT_INCREASE,
          Element.POTION_REMOTE_CONTROL,
          Element.POTION_IMMUNE,
          Element.POISON_THROWER,
          Element.POTION_EXPLODER,
          Element.OTHER_HERO_DEAD,
          Element.ENEMY_HERO_DEAD,
        ]) && !willLocationExplode(x, y)
      );
    }

    function willLocationExplode(x, y) {
      const blasts = board.getBlasts();
      const futureBlasts = board.getFutureBlasts();

      return [...futureBlasts, ...blasts].some(
        (blast) => blast.x === x && blast.y === y
      );
    }

    function getMovementFromDirection(direction) {
      switch (direction) {
        case Directions.UP:
          return Direction.UP;
        case Directions.RIGHT:
          return Direction.RIGHT;
        case Directions.DOWN:
          return Direction.DOWN;
        case Directions.LEFT:
          return Direction.LEFT;
      }
    }

    function getPerkDirectionIfCanBeTaken(heroX, heroY) {
      if (
        board.isAnyOfAt(heroX + 1, heroY, [
          Element.POTION_BLAST_RADIUS_INCREASE,
          Element.POTION_COUNT_INCREASE,
          Element.POTION_REMOTE_CONTROL,
          Element.POTION_IMMUNE,
          Element.POISON_THROWER,
          Element.POTION_EXPLODER,
        ])
      ) {
        return Directions.RIGHT;
      } else if (
        board.isAnyOfAt(heroX - 1, heroY, [
          Element.POTION_BLAST_RADIUS_INCREASE,
          Element.POTION_COUNT_INCREASE,
          Element.POTION_REMOTE_CONTROL,
          Element.POTION_IMMUNE,
          Element.POISON_THROWER,
          Element.POTION_EXPLODER,
        ])
      ) {
        return Directions.LEFT;
      } else if (
        board.isAnyOfAt(heroX, heroY + 1, [
          Element.POTION_BLAST_RADIUS_INCREASE,
          Element.POTION_COUNT_INCREASE,
          Element.POTION_REMOTE_CONTROL,
          Element.POTION_IMMUNE,
          Element.POISON_THROWER,
          Element.POTION_EXPLODER,
        ])
      ) {
        return Directions.UP;
      } else if (
        board.isAnyOfAt(heroX, heroY - 1, [
          Element.POTION_BLAST_RADIUS_INCREASE,
          Element.POTION_COUNT_INCREASE,
          Element.POTION_REMOTE_CONTROL,
          Element.POTION_IMMUNE,
          Element.POISON_THROWER,
          Element.POTION_EXPLODER,
        ])
      ) {
        return Directions.DOWN;
      }

      return false;
    }

    function hasTargetToExplode(heroX, heroY) {
      function treasureBoxIsReachable() {
        return (
          board.isNear(heroX, heroY, Element.TREASURE_BOX) &&
          (board.isAt(heroX + 1, heroY, Element.TREASURE_BOX) ||
            board.isAt(heroX - 1, heroY, Element.TREASURE_BOX) ||
            board.isAt(heroX, heroY + 1, Element.TREASURE_BOX) ||
            board.isAt(heroX, heroY - 1, Element.TREASURE_BOX))
        );
      }

      return (
        treasureBoxIsReachable() ||
        board.isNear(heroX, heroY, Element.GHOST) ||
        board.isNear(heroX, heroY, Element.OTHER_HERO) ||
        board.isNear(heroX, heroY, Element.OTHER_HERO_POTION) ||
        board.isNear(heroX, heroY, Element.ENEMY_HERO) ||
        board.isNear(heroX, heroY, Element.ENEMY_HERO_POTION)
      );
    }

    function getEscapeDirectionFromBlast(heroX, heroY) {
      // Check moving to top-right and top-left
      if (canMoveTo(heroX, heroY + 1)) {
        if (canMoveTo(heroX + 1, heroY + 1)) {
          return Direction.UP;
        } else if (canMoveTo(heroX - 1, heroY + 1)) {
          return Direction.UP;
        }
      }

      // Check moving to bottom-right and bottom-left
      if (canMoveTo(heroX, heroY - 1)) {
        if (canMoveTo(heroX + 1, heroY - 1)) {
          return Direction.DOWN;
        } else if (canMoveTo(heroX - 1, heroY - 1)) {
          return Direction.DOWN;
        }
      }

      // Check moving to right-top and right-bottom
      if (canMoveTo(heroX + 1, heroY)) {
        if (canMoveTo(heroX + 1, heroY + 1)) {
          return Direction.RIGHT;
        } else if (canMoveTo(heroX + 1, heroY - 1)) {
          return Direction.RIGHT;
        }
      }

      // Check moving to left-top and left-bottom
      if (canMoveTo(heroX - 1, heroY)) {
        if (canMoveTo(heroX - 1, heroY + 1)) {
          return Direction.LEFT;
        } else if (canMoveTo(heroX - 1, heroY - 1)) {
          return Direction.LEFT;
        }
      }

      return null;
    }

    const { x: heroX, y: heroY } = board.getHero();

    // If hero has a perk to take
    const perkDirection = getPerkDirectionIfCanBeTaken(heroX, heroY);
    if (perkDirection) {
      const perkLocation = getLocationFromDirection(
        heroX,
        heroY,
        perkDirection
      );
      if (!willLocationExplode(perkLocation.x, perkLocation.y)) {
        return getMovementFromDirection(perkDirection);
      }
    }

    // If hero has a target to explode
    const escapeDirectionFromBlast = getEscapeDirectionFromBlast(heroX, heroY);
    if (hasTargetToExplode(heroX, heroY) && escapeDirectionFromBlast) {
      return [Direction.ACT, escapeDirectionFromBlast];
    }

    for (let i = 0; i < 3; i++) {
      const nextLocation = getLocationFromDirection(
        heroX,
        heroY,
        nextDirection
      );

      console.log("Location will explode", willLocationExplode(heroX, heroY));
      console.log("Trying direction is", nextDirection);
      console.log("Can move", canMoveTo(nextLocation.x, nextLocation.y));
      if (canMoveTo(nextLocation.x, nextLocation.y)) {
        return getMovementFromDirection(nextDirection);
      } else {
        nextDirection = getRandomDirection();
      }
    }

    return "";
  },
});
