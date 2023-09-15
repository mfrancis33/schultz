# Schultz
Code for an HTML5/JS version of the dice game "Farkle", or as my family calls it, "Schultz".

## How to play the game
More in-depth instructions are included in the project itself. Schultz is a high-scoring risk/gambling game played with 2+ people where you roll dice to earn points, winning if you reach a point threshold before anyone else. Values of the dice are explained later. *Note: currently, this game is same-device multiplayer. A network multiplayer version is planned.*

On your turn, you can roll dice as many times as you want so long as you gain points on your roll. If you don't have any score on the board (simply called "on the board"), you have to accumulate over a minimum threshold of points in a turn to be able to get on the board. If you do not roll any points in a roll, you lose your turn. If you are on the board, you additionally lose 50 points.

You can also choose which scoring dice you would like to "hold" in a roll (by default, this project holds all scoring dice, allowing the user to toggle between holding and unholding). If all dice are held at the end of a roll, you can roll them all for additional points.

To win the game, you must be the first player to reach a threshold of points before anyone else (default is 5000). Additionally, if you cross this threshold and have the option enabled, all other players get one additional turn to attempt to beat your score. This process will repeat until no other player is able to beat the winner's score.

### Scoring
Scoring in a roll is determined by the scoring dice in that roll, not dice from previous rolls. Multiple dice can score in a roll.
- Each 5 is worth 50 points
- Each 1 is worth 100 points
- A 3-of-a-kind, unless it is of 1's, is worth 100 times the value of the die (if it is with 5's, the original points do not count)
  - A 3-of-a-kind with 1's is worth three 1's, or 300 points
- A straight with 5 dice is worth 1000 points.
- A 5-of-a-kind is worth 1500 points

## How to use this project
To set up this project on your own system, the only necessary step is to download all files in the /src folder and put them in the same directory. Then, open the file in your browser. This project does not currently support network multiplayer.

Currently, this project is just static files. In the future, I plan on integrating an Express/Socket.io server with Node.js to allow for network multiplayer. The installation instructions will be changed accordingly if that happens.

## Future
Due to being busy in real life, I have not had much time to work on this project, nor has it been a priority for me. The v0.4.0 branch, where most development has been recently, will add a basic server and allow for playing the same game across multiple devices.
