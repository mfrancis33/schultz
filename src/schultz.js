(() => {
	//Global variables
	const socket = io.connect();
	const names = [];
	const scoreboard = [];
	let minscore = 600;
	let maxscore = 5000;
	let canPlay = false;
	let doEndGame = true;
	let endGame = false;
	let randSpread = true;
	
	let tempscore = 0;
	let turn = 0;
	let round = 0;
	let roll = 0;
	let scoreToBeat = -1;
	let endGameLast = -1;

	// Dice things
	//#region
	
	class Die {
		constructor(el){
			this.el = el;
			this.held = false;
			this.value = 0;
			this.linked = [];
			this.x = -99;
			this.y = -99;
			this.rollHeld = -1;
			this.canHold = true;
			
			el.onclick = (ev) => {
				ev.stopPropagation();
				this.toggleHold();
			};
		}
		
		toggleHold(force=false, link=false){
			if(!force && (!this.canHold|| !canPlay || (this.rollHeld != -1 && this.rollHeld != roll))) return;
			this.held = !this.held;
			this.el.classList.toggle("held", this.held);
			
			if(this.held) this.rollHeld = roll;
			else this.rollHeld = -1;
			
			if(link) return;
			
			if(this.value != 1 && this.value != 5){
				tempscore += 100 * this.value * (this.held ? 1 : -1);
				updateScore();
			} else if(this.value == 5){
				if(this.linked.length > 0){
					tempscore += 500 * (this.held ? 1 : -1);
				} else {
					tempscore += 50 * (this.held ? 1 : -1);
				}
				updateScore();
			} else if(this.value == 1){
				if(this.linked.length > 0){
					tempscore += 1000 * (this.held ? 1 : -1);
				} else {
					tempscore += 100 * (this.held ? 1 : -1);
				}
				updateScore();
			}
			
			if(this.linked.length > 0){
				for(let die of this.linked){
					die.toggleHold(true, true);
				}
			}
		}
		
		draw(){
			/** @type {HTMLCanvasElement} */
			const canv = this.el;
			const ctx = canv.getContext("2d");
			
			ctx.clearRect(0, 0, canv.width, canv.height);
			ctx.fillStyle = window.getComputedStyle(canv).color;
			
			function drawDot(pos){
				let x, y = 0;
				switch(pos){
					case 1:
						x = canv.width / 5;
						y = canv.height / 5;
						break;
					case 2:
						x = canv.width / 5 * 4;
						y = canv.height / 5;
						break;
					case 3:
						x = canv.width / 5;
						y = canv.height / 2;
						break;
					case 4:
						x = canv.width / 2;
						y = canv.height / 2;
						break;
					case 5:
						x = canv.width / 5 * 4;
						y = canv.height / 2;
						break;
					case 6:
						x = canv.width / 5;
						y = canv.height / 5 * 4;
						break;
					case 7:
						x = canv.width / 5 * 4;
						y = canv.height / 5 * 4;
						break;
				}
				ctx.beginPath();
				ctx.arc(x, y, canv.width / 16, 0, Math.PI * 2);
				ctx.fill();
			}
			
			/*
			* Die positions:
			* 
			* 1   2
			* 3 4 5 
			* 6   7
			*/
			
			switch(this.value){
				case 1:
					drawDot(4);
					break;
				case 2:
					drawDot(1);
					drawDot(7);
					break;
				case 3:
					drawDot(1);
					drawDot(4);
					drawDot(7);
					break;
				case 4:
					drawDot(1);
					drawDot(2);
					drawDot(6);
					drawDot(7);
					break;
				case 5:
					drawDot(1);
					drawDot(2);
					drawDot(4);
					drawDot(6);
					drawDot(7);
					break;
				case 6:
					drawDot(1);
					drawDot(2);
					drawDot(3);
					drawDot(5);
					drawDot(6);
					drawDot(7);
					break;
			}
		}
		
		link(die){
			die = [...die];
			if(die.indexOf(this) > -1) die.splice(die.indexOf(this), 1);
			
			for(let i = 0; i < die.length; i++) this.linked.push(die[i]);
		}
		unlink(){
			this.linked = [];
		}
		
		rollPrepare(){
			if(this.held) return;
			
			const b = document.getElementById("board").getBoundingClientRect();
			this.el.classList.remove("hidden");
			this.x = Math.round(b.width / 2);
			this.y = Math.ceil(b.height + this.el.width * Math.sqrt(2));
			this.el.style.transform = "translate(" + this.x + "px, " + this.y + "px) rotate(" + (Math.random() * 360) + "deg)";
			
			this.value = Math.ceil(Math.random() * 6);
			this.draw();
		}
		
		reset(){
			this.value = 0;
			this.held = false;
			this.el.classList.remove("held");
			this.el.classList.remove("permaheld");
			this.el.classList.add("hidden");
			this.unlink();
			this.rollHeld = -1;
			this.canHold = true;
		}
	}
	
	const dice = [
		new Die(document.getElementById("d1")),
		new Die(document.getElementById("d2")),
		new Die(document.getElementById("d3")),
		new Die(document.getElementById("d4")),
		new Die(document.getElementById("d5"))
	];
	
	function updateScore(){
		document.getElementById("tempscore").innerText = tempscore;
		document.getElementById("score").innerText = (round == 0 || typeof scoreboard[turn][round - 1] !== "number" ? 0 : scoreboard[turn][round - 1]) + tempscore;
	}
	
	//#endregion
	///////////////////////////////////////////////////////////////////////////////////////////////////////////
	///////////////////////////////////////////////////////////////////////////////////////////////////////////
	// Back to home buttons
	//#region

	document.getElementById("newgame2home").onclick = () => {
		document.getElementById("newgame").classList.add("hidden");
		document.getElementById("start").classList.remove("hidden");
	}

	document.getElementById("h2p2home").onclick = () => {
		document.getElementById("h2p").classList.add("hidden");
		document.getElementById("start").classList.remove("hidden");
	}

	document.getElementById("past2home").onclick = () => {
		document.getElementById("pastgames").classList.add("hidden");
		document.getElementById("start").classList.remove("hidden");
	}

	document.getElementById("end2home").onclick = () => {
		document.body.classList.remove("p" + (turn + 1));
		document.getElementById("end").classList.add("hidden");
		document.getElementById("start").classList.remove("hidden");
	}
	
	//#endregion
	///////////////////////////////////////////////////////////////////////////////////////////////////////////
	///////////////////////////////////////////////////////////////////////////////////////////////////////////
	// Other button event listeners
	//#region
	
	document.getElementById("new").onclick = () => {
		//Check for saved game that may be deleted if continuing
		if(saveGameExists()){
			//Ask user if they wish to overwrite it
			if(!confirm("Your save file will be overwritten! Are you sure you wish to continue?")) return;
		}
		//Change scenery
		document.getElementById("start").classList.add("hidden");
		document.getElementById("newgame").classList.remove("hidden");
	}

	document.getElementById("continue").onclick = () => {
		//Check for save file
		if(!saveGameExists()){
			alert("No save file!");
			return;
		}
		//Load save file (also does screen transition)
		loadGame();
	}

	document.getElementById("h2pbutton").onclick = () => {
		document.getElementById("start").classList.add("hidden");
		document.getElementById("h2p").classList.remove("hidden");
	}

	document.getElementById("pastbutton").onclick = () => {
		document.getElementById("start").classList.add("hidden");
		document.getElementById("pastgames").classList.remove("hidden");
		getArchives();
	}
	
	document.getElementById("pastgameback").onclick = () => {
		document.getElementById("pastgameview").classList.add("hidden");
		document.getElementById("pastgames").classList.remove("hidden");
		document.body.classList.remove("p1", "p2", "p3", "p4", "p5", "p6", "p7", "p8");
	}
	
	document.getElementById("pcount").onchange = () => {
		const self = document.getElementById("pcount");
		let list = document.getElementById("playercount");

		if(list.children.length > Number(self.value)){
			while(list.children.length > Number(self.value)){
				//Remove last child
				list.children[list.children.length - 1].remove();
			}
		} else {
			while(list.children.length < Number(self.value)){
				//Add new input
				let num = list.children.length + 1;
				let elem = document.createElement("li");
				let inp = elem.appendChild(document.createElement("input"));
				inp.type = "text";
				inp.placeholder = "Player " + num + " name";
				inp.name = "name" + num;
				inp.setAttribute("minlength", 1);
				inp.setAttribute("maxlength", 32);
				inp.required = true;
				list.appendChild(elem);
			}					
		}
	}
	
	document.getElementById("setup").onsubmit = ev => {
		ev.preventDefault();
		const form = document.forms.setup;

		//Reset variables
		if(round > 0){
			tempscore = 0;
			round = 0;
			turn = 0;
			roll = 0;
			for(const die of dice){
				die.reset();
			}
			scoreToBeat = -1;
			endGameLast = -1;
			endGame = false;
		}
		
		//Extract names
		//First two are required
		names.splice(0, names.length);
		scoreboard.splice(0, names.length);
		names.push(form.name1.value);
		//After that they are optional, only add if we can
		if(form.name2) names.push(form.name2.value);
		if(form.name3) names.push(form.name3.value);
		if(form.name4) names.push(form.name4.value);
		if(form.name5) names.push(form.name5.value);
		if(form.name6) names.push(form.name6.value);
		if(form.name7) names.push(form.name7.value);
		if(form.name8) names.push(form.name8.value);
		
		//Set up scoreboard too (front and back ends)
		const sbElem = document.getElementById("scoreboard");
		const sbHead = sbElem.querySelector("thead tr");
		const sbBody = sbElem.querySelector("tbody");
		sbHead.innerHTML = "";
		sbBody.innerHTML = "<tr></tr>";
		for(let i = 0; i < names.length; i++){
			scoreboard.push([]);
			
			let th = sbElem.querySelector("thead tr").appendChild(document.createElement("th"));
			th.innerText = names[i];
			th.classList.add("p" + (i + 1));
			let td = sbElem.querySelector("tbody tr").appendChild(document.createElement("td"));
			td.innerText = "\xa0";
			
			if(i == 0){
				sbElem.querySelector("th").classList.add("active");
				sbElem.querySelector("td").classList.add("active");
			}
		}
		document.getElementById("turn").innerText = names[0];
		
		//Set up min/max scores
		minscore = Number(form.min.value);
		maxscore = Number(form.max.value);
		doEndGame = form.endgame.checked;
		
		//Misc settings
		randSpread = form.spread.checked;
		document.body.classList.toggle("nocol", !form.colors.checked);
		document.getElementById("particles").classList.toggle("hidden", !form.confetti.checked);
		
		//Switch screen
		document.getElementById("newgame").classList.add("hidden");
		document.getElementById("game").classList.remove("hidden");
		document.body.classList.add("p1");
		
		//Can play now
		canPlay = true;
		resize();
	}
	
	document.getElementById("again").onclick = () => {
		document.body.classList.remove("p" + (turn + 1));
		document.getElementById("end").classList.add("hidden");
		document.getElementById("newgame").classList.remove("hidden");
	}
	
	//#endregion
	///////////////////////////////////////////////////////////////////////////////////////////////////////////
	///////////////////////////////////////////////////////////////////////////////////////////////////////////
	// In-game functions
	//#region
	
	async function rollDie(){
		if(!canPlay || (document.querySelectorAll(".held:not(.permaheld)").length == 0 && dice[0].value > 0)){
			document.getElementById("roll").style.animation = "button-no 0.4s linear normal";
			setTimeout(() => {document.getElementById("roll").style.animation = "";}, 400);
			return;
		}
		canPlay = false;
		
		roll++;
		
		//Get dice
		const d1 = dice[0];
		const d2 = dice[1];
		const d3 = dice[2];
		const d4 = dice[3];
		const d5 = dice[4];
		
		if(d1.el.classList.contains("held")) d1.el.classList.add("permaheld");
		if(d2.el.classList.contains("held")) d2.el.classList.add("permaheld");
		if(d3.el.classList.contains("held")) d3.el.classList.add("permaheld");
		if(d4.el.classList.contains("held")) d4.el.classList.add("permaheld");
		if(d5.el.classList.contains("held")) d5.el.classList.add("permaheld");
		
		d1.canHold = true;
		d2.canHold = true;
		d3.canHold = true;
		d4.canHold = true;
		d5.canHold = true;
		
		//Reset if all 5 are held
		if(d1.held && d2.held && d3.held && d4.held && d5.held){
			d1.reset();
			d2.reset();
			d3.reset();
			d4.reset();
			d5.reset();
		}
		
		//Prepare
		d1.rollPrepare();
		d2.rollPrepare();
		d3.rollPrepare();
		d4.rollPrepare();
		d5.rollPrepare();
		
		await new Promise(resolve => setTimeout(resolve, 50));
		
		d1.el.classList.add("rolling");
		d2.el.classList.add("rolling");
		d3.el.classList.add("rolling");
		d4.el.classList.add("rolling");
		d5.el.classList.add("rolling");
		
		//Now we figure out where to position them so they don't overlap
		const b = document.getElementById("board").getBoundingClientRect();
		if(randSpread){
			const h = d1.el.width * Math.sqrt(2);
			
			for(let i = 0; i < 5; i++){
				if(dice[i].held) continue;
				
				let distanced, x, y;
				
				do {
					distanced = true;
					//Get random x and y
					x = Math.round(Math.random() * (b.width - h));
					y = Math.round(Math.random() * (b.height - h));
					
					distanced &= Math.sqrt(Math.pow((d1.x - x), 2) + Math.pow((d1.y - y), 2)) > h;
					distanced &= Math.sqrt(Math.pow((d2.x - x), 2) + Math.pow((d2.y - y), 2)) > h;
					distanced &= Math.sqrt(Math.pow((d3.x - x), 2) + Math.pow((d3.y - y), 2)) > h;
					distanced &= Math.sqrt(Math.pow((d4.x - x), 2) + Math.pow((d4.y - y), 2)) > h;
					distanced &= Math.sqrt(Math.pow((d5.x - x), 2) + Math.pow((d5.y - y), 2)) > h;
				} while(!distanced);
				
				dice[i].el.style.transform = "translate(" + x + "px, " + y + "px) rotate(" + (Math.random() * 720) + "deg)";
				dice[i].x = x;
				dice[i].y = y;
			}
		} else {
			for(let i = 0; i < 5; i++){
				let x = b.width / 7 * (i + 1);
				let y = b.height / 2;
				
				dice[i].el.style.transform = "translate(" + x + "px, " + y + "px)" +
					(dice[i].held ?
					/ rotate\([\d.]+deg\)/gm.exec(dice[i].el.style.transform)[0] :
					" rotate(" + (Math.random() * 720) + "deg)");
				dice[i].x = x;
				dice[i].y = y;
			}
		}
		
		//Wait 750ms
		await new Promise(resolve => setTimeout(resolve, 750));
		
		//We no longer need smooth transitions
		d1.el.classList.remove("rolling");
		d2.el.classList.remove("rolling");
		d3.el.classList.remove("rolling");
		d4.el.classList.remove("rolling");
		d5.el.classList.remove("rolling");
		
		//Determine points
		determinePoints();
		
		//We can play again
		canPlay = true;
	}
	
	async function determinePoints(){
		//Get dice
		const d1 = dice[0];
		const d2 = dice[1];
		const d3 = dice[2];
		const d4 = dice[3];
		const d5 = dice[4];
		
		//Figure out values of not held dice
		let nums = {
			1: 0,
			2: 0,
			3: 0,
			4: 0,
			5: 0,
			6: 0
		}
		
		if(!d1.held) nums[d1.value]++;
		if(!d2.held) nums[d2.value]++;
		if(!d3.held) nums[d3.value]++;
		if(!d4.held) nums[d4.value]++;
		if(!d5.held) nums[d5.value]++;
		
		//Look for straights
		//They will always have a 2, 3, 4, and 5; we just need to look for 1 or 6
		if((nums[1] == 1 || nums[6] == 1) && nums[2] == 1 && nums[3] == 1 && nums[4] == 1 && nums[5] == 1){
			tempscore += 1000;
			updateScore();
			confetti();
			for(let i = 0; i < 5; i++){
				dice[i].toggleHold(true, true);
				dice[i].canHold = false;
			}
			return;
		}
		//Look for all dice on same number
		if(nums[1] == 5 || nums[2] == 5 || nums[3] == 5 || nums[4] == 5 || nums[5] == 5 || nums[6] == 5){
			tempscore += 1500;
			updateScore();
			confetti();
			for(let i = 0; i < 5; i++){
				dice[i].toggleHold(true, true);
				dice[i].canHold = false;
			}
			return;
		}
		//Look for triples
		if(nums[1] >= 3 || nums[2] >= 3 || nums[3] >= 3 || nums[4] >= 3 || nums[5] >= 3 || nums[6] >= 3){
			let num;
			if(nums[1] >= 3) num = 1;
			if(nums[2] >= 3) num = 2;
			if(nums[3] >= 3) num = 3;
			if(nums[4] >= 3) num = 4;
			if(nums[5] >= 3) num = 5;
			if(nums[6] >= 3) num = 6;
			
			let count = 0;
			let linked = [];
			for(let i = 0; i < 5; i++){
				if(dice[i].value == num){
					if(count < 3) linked.push(dice[i]);
					else if(num !== 5) dice[i].canHold = false;
					count++;
				}
			}
			for(let i = 0; i < linked.length; i++){
				linked[i].link(linked);
			}
			linked[0].toggleHold(true);
		}
		//Determine if we're out of luck
		//We aren't if we got a triple, therefore this is an else so we don't have to check again
		else if(nums[1] == 0 && nums[5] == 0){
			tempscore = -50;
			updateScore();
			
			await new Promise(resolve => setTimeout(resolve, 2000));
			
			updateScoreboard();
			
			d1.reset();
			d2.reset();
			d3.reset();
			d4.reset();
			d5.reset();
			
			return;
		}
		
		//Hold the rest of the ones and fives and mark the others as unable to hold
		for(let i = 0; i < 5; i++){
			if(!dice[i].held && (dice[i].value == 1 || dice[i].value == 5)){
				dice[i].toggleHold(true);
			} else if(!dice[i].held){
				dice[i].canHold = false;
			}
		}
		
	}
	
	document.getElementById("board").onclick = rollDie;
	document.getElementById("roll").onclick = rollDie;
	
	document.getElementById("stay").onclick = () => {
		if(!canPlay) return;
		
		//Can we actually stay?
		if(
			//Hasn't scored yet or lost
			tempscore <= 0
			||
			//Hasn't scored at all
			((round == 0 || typeof scoreboard[turn][round - 1] !== "number") && tempscore < minscore)
			||
			//Endgame have we beat score
			(endGame && scoreboard[turn][round - 1] + tempscore <= scoreToBeat)
		){
			document.getElementById("stay").style.animation = "button-no 0.4s linear normal";
			setTimeout(() => {document.getElementById("stay").style.animation = "";}, 400)
			return;
		}
		
		for(let i = 0; i < 5; i++){
			dice[i].reset();
		}
		
		updateScoreboard();
	};
	
	function updateScoreboard(){
		if(!canPlay) return;
		canPlay = false;
		
		//Update front-end scoreboard
		const sbElem = document.getElementById("scoreboard");
		const sbHead = sbElem.querySelector("thead tr");
		const sbBody = sbElem.querySelector("tbody");
		sbHead.children[turn].classList.remove("active");
		sbBody.children[round].children[turn].classList.remove("active");
		document.body.classList.remove("p" + (turn + 1));
		
		//Update back end scoreboard
		//Determine if we can count player's score
		if(round == 0 || isNaN(parseInt(scoreboard[turn][round - 1], 10))){
			//Player is not on board, determine if they can be now
			if(tempscore >= minscore){
				//Yes
				scoreboard[turn][round] = tempscore;
			} else {
				//No
				scoreboard[turn][round] = "\u2014";
			}
		} else {
			//Add tempscore to last
			scoreboard[turn][round] = (scoreboard[turn][round - 1] || 0) + tempscore;
		}
		
		//Update score on board
		sbBody.children[round].children[turn].innerText = scoreboard[turn][round];
			
		//Winning and end game checks
		if(endGame){
			//Check for end game win
			if(scoreboard[turn][round] > scoreToBeat){
				confetti();
				scoreToBeat = scoreboard[turn][round];
				endGameLast = turn == 0 ? names.length - 1 : turn - 1;
				sbBody.querySelector(".beat").classList.remove("beat");
				sbBody.children[round].children[turn].classList.add("beat");
			}
			//Check for end of game
			else if(turn == endGameLast){
				//End of game
				turn++;
				turn %= names.length;
				endOfGame();
				return;
			}
		} else {
			//Check for initial win
			if(scoreboard[turn][round] >= maxscore){
				if(doEndGame){
					confetti();
					//Initiate the final battle of all battles!!!!!!!!
					endGame = true;
					scoreToBeat = scoreboard[turn][round];
					endGameLast = turn == 0 ? names.length - 1 : turn - 1;
					//Also add class thingy
					sbBody.children[round].children[turn].classList.add("beat");
				} else {
					//End of game
					endOfGame();
					return;
				}
			}
		}
		
		
		//Update turn
		turn++;
		if(turn >= names.length){ //shouldn't ever be > but just for safety
			turn = 0;
			round++;
			//for(let i = 0; i < scoreboard.length; i++){
			//	scoreboard[i].push(null);
			//}
			let tr = sbBody.appendChild(document.createElement("tr"));
			for(let i = 0; i < names.length; i++){
				tr.appendChild(document.createElement("td")).innerText = "\xa0";
			}
		}
		//Front-end update turn
		sbHead.children[turn].classList.add("active");
		sbBody.children[round].children[turn].classList.add("active");
		sbBody.children[round].children[turn].scrollIntoView({block: "nearest"});
		document.getElementById("turn").innerText = names[turn];
		document.body.classList.add("p" + (turn + 1));
		
		canPlay = true;
		
		//Score
		tempscore = 0;
		updateScore();

		//Update save file
		saveGame();
	}
	
	async function endOfGame(){
		//Archive game
		archiveGame();
		
		//Readd color theme
		document.body.classList.add("p" + (turn + 1));

		//Confetti and update screen
		confetti();
		tempscore = 0;
		updateScore();
		document.getElementById("turn").innerText = names[turn];

		//Wait 2 seconds for dramatic effect
		// await new Promise(resolve => setTimeout(resolve, 2000));
		
		//Switch screen
		document.getElementById("game").classList.add("hidden");
		document.getElementById("end").classList.remove("hidden");
		
		//Sort scores
		let scores = [];
		
		for(let i = 0; i < names.length; i++){
			scores.push({
				name: names[i],
				score: scoreboard[i][scoreboard[i].length - 1]
			});
		}
		scores.sort((a, b) => (typeof b.score == "number" ? b.score : 0) - (typeof a.score == "number" ? a.score : 0));

		//Add win order rows
		document.getElementById("order").querySelector("tbody").innerHTML = "";
		
		for(let i = 0; i < scores.length; i++){
			let tr = document.createElement("tr");
			tr.appendChild(document.createElement("th")).innerText = i + 1;
			tr.appendChild(document.createElement("td")).innerText = scores[i].name;
			tr.appendChild(document.createElement("td")).innerText = scores[i].score;
			document.getElementById("order").querySelector("tbody").appendChild(tr);
		}
		
		document.getElementById("winner").innerText = scores[0].name;
		document.getElementById("finalscore").innerText = scores[0].score;
	}
	
	//#endregion
	///////////////////////////////////////////////////////////////////////////////////////////////////////////
	///////////////////////////////////////////////////////////////////////////////////////////////////////////
	// Downloading functions and event listeners
	//#region
	
	function download(format, winner){
		let s = "";
		const d = new Date();
		
		if(format == "txt"){
			//Figure out width
			let w = 27 + minscore.toString().length + maxscore.toString().length;
			const wDefault = w;//default width for reference
			//Gets length of biggest number in case names are too short
			const biggestNumLen = (() => {let m = 0; for(let i = 0; i < names.length; i++) m = Math.max(m, ...scoreboard[i]); return m.toString().length;})();
			let col = (() => {
				//Default max value is length of biggest number
				let m = Math.max(minscore.toString().length, biggestNumLen);
				//Compare max value to length of everyone's name to get biggest width
				for(let i = 0; i < names.length; i++){
					m = Math.max(m, names[i].length);
				}
				
				//Add m (max length of name) with spaces around it times the number of names plus bars between
				return m;
			})();
			w = Math.max(w, (col + 2) * names.length + (names.length - 1));
			//Check if the columns are too small (we'll need to scale them)
			if(w === wDefault){
				//Set column width
				col = Math.ceil((w - (names.length - 1) - (names.length * 2)) / names.length);
				//Scale total width to fit columns
				w = (col + 2) * names.length + (names.length - 1);
			}
			
			//Horizontal bar
			s += "-" + (() => {let a = ""; for(let i = 0; i < w; i++) a += "-"; return a;})() + "-\r\n";
			
			//Header
			s += "|SCHULTZ "
				+ (() => {let a = ""; for(let i = 0; i < w - 24 - minscore.toString().length - maxscore.toString().length; i++) a += "="; return a;})()
				+ " Start: " + minscore + " | End: " + maxscore + "|\r\n";
			
			//Another horizontal bar
			s += "|" + (() => {let a = ""; for(let i = 0; i < w; i++) a += "-"; return a;})() + "|\r\n";
			
			//Names
			for(let i = 0; i < names.length; i++){
				s += "|";
				const left = Math.floor((col - names[i].length) / 2) - (i == winner ? 1 : 0);
				const right = Math.ceil((col - names[i].length) / 2) - (i == winner ? 1 : 0);
				s += " "
					+ (() => {let a = ""; for(let j = 0; j < left; j++) a += " "; return a;})()
					+ (i == winner ? "{" : "")
					+ names[i]
					+ (i == winner ? "}" : "")
					+ (() => {let a = ""; for(let j = 0; j < right; j++) a += " "; return a;})()
					+ " ";
			}
			s += "|\r\n";
			
			//Horizontal bars below names
			for(let i = 0; i < names.length; i++){
				s += "|";
				s += (() => {let a = ""; for(let j = 0; j < col + 2; j++) a += "-"; return a;})()
			}
			s += "|\r\n";
			
			//Scores
			const rows = (() => {let m = 0; for(let j = 0; j < names.length; j++) m = Math.max(m, scoreboard[j].length); return m;})();
			for(let i = 0; i < rows; i++){
				for(let j = 0; j < names.length; j++){
					s += "|";
					const num = scoreboard[j][i] == null ? "" : (scoreboard[j][i] == "\u2014" ? "---" : scoreboard[j][i]);
					const left = Math.floor((col - num.toString().length) / 2);// + (j == winner ? 1 : 0);
					const right = Math.ceil((col - num.toString().length) / 2);// + (j == winner ? 1 : 0);
					s += " "
						+ (() => {let a = ""; for(let k = 0; k < left; k++) a += " "; return a;})()
						+ num
						+ (() => {let a = ""; for(let k = 0; k < right; k++) a += " "; return a;})()
						+ " ";
				}
				s += "|\r\n";
			}
			
			//Another horizontal bar, would you believe it
			s += "-" + (() => {let a = ""; for(let i = 0; i < w; i++) a += "-"; return a;})() + "-\r\n";
			
			//Footer
			s += d.getFullYear() + "/" + (d.getMonth()+1) + "/" + d.getDate();
		} else if(format == "csv"){
			s += names.join(",");
			let rows = (() => {let m = 0; for(let j = 0; j < names.length; j++) m = Math.max(m, scoreboard[j].length); return m;})();
			for(let i = 0; i < rows; i++){
				for(let j = 0; j < names.length; j++){
					s += (scoreboard[j][i] || "") + (j !== names.length - 1 ? "," : "");
				}
				s += "\n";
			}
		} else {
			return;
		}
		
		let a = document.createElement("a");
		a.setAttribute("href", "data:text/plain;charset=utf-8," + s);
		a.setAttribute("download", "Schultz-" + d.getFullYear() + "-" + (d.getMonth()+1) + "-" + d.getDate() + "." + format);
		a.click();
	}
	
	document.getElementById("downloadtxt").onclick = () => {download("txt", turn)};
	document.getElementById("downloadcsv").onclick = () => {download("csv", turn)};
	
	//#endregion
	///////////////////////////////////////////////////////////////////////////////////////////////////////////
	///////////////////////////////////////////////////////////////////////////////////////////////////////////
	// iOS cosmetic changes and save game states
	//#region
	
	//Detect iOS Safari for slight CSS changes
	function iOS() {
		//https://stackoverflow.com/a/29696509
		let ua = window.navigator.userAgent;
		let iOS = !!ua.match(/iPad/i) || !!ua.match(/iPhone/i);
		let webkit = !!ua.match(/WebKit/i);
		let iOSSafari = iOS && webkit && !ua.match(/CriOS/i);
		return iOSSafari;
	}
	
	if(iOS()){
		document.body.classList.add("safari");
	}
	
	///////////////////////////////////////////////////////////////////////////////////////////////////////////
	///////////////////////////////////////////////////////////////////////////////////////////////////////////

	function saveGameExists(){
		try {
			return (localStorage.getItem("save") || "{}") !== "{}";
		} catch {
			return false;
		}
	}
	
	function saveGame(){
		try {
			localStorage.setItem("save", JSON.stringify({
				names: names,
				minscore: minscore,
				maxscore: maxscore,
				scoreboard: scoreboard,
				turn: turn,
				endGame: {
					active: endGame,
					scoreToBeat: scoreToBeat,
					endGameLast: endGameLast
				},
				settings: {
					doEndGame: doEndGame,
					doRandomSpread: randSpread,
					doPlayerColors: !document.body.classList.contains("nocol"),
					doConfetti: !canv.classList.contains("hidden")
				}
			}));
		} catch(e){
			console.error(e);
		}
	}

	function loadGame(){
		if(!saveGameExists()){
			//Throw a fit if no save file (didn't check previously)
			throw "No save file!";
		}

		try {
			//Get save file
			let saveFile = JSON.parse(localStorage.getItem("save"));

			//Set variables and such
			names.splice(0, names.length);
			for(let name of saveFile.names){
				names.push(name);
			}
			scoreboard.splice(0, scoreboard.length);
			for(let row of saveFile.scoreboard){
				scoreboard.push(row);
			}
			minscore = saveFile.minscore;
			maxscore = saveFile.maxscore;
			turn = saveFile.turn;
			endGame = saveFile.endGame.active;
			scoreToBeat = saveFile.endGame.scoreToBeat;
			endGameLast = saveFile.endGame.endGameLast;
			//Yes this is entirely necessary to get the round variable
			const rows = (() => {let m = 0; for(let i = 0; i < names.length; i++) m = Math.max(m, scoreboard[i].length); return m;})();
			round = rows - 1;
			
			//Set settings
			doEndGame = saveFile.settings.doEndGame;
			randSpread = saveFile.settings.doRandomSpread;
			document.body.classList.toggle("nocol", !saveFile.settings.doPlayerColors);
			canv.classList.toggle("hidden", !saveFile.settings.doConfetti);

			//Do scoreboard schenanigans
			const sbElem = document.getElementById("scoreboard");
			const sbHead = sbElem.querySelector("thead tr");
			const sbBody = sbElem.querySelector("tbody");
			sbHead.innerHTML = "";
			sbBody.innerHTML = "";
			for(let i = 0; i < names.length; i++){
				const th = sbHead.appendChild(document.createElement("th"));
				th.innerText = names[i];
				th.classList.add("p" + (i + 1));
			}
			for(let i = 0; i < rows; i++){
				const tr = sbBody.appendChild(document.createElement("tr"));
				for(let j = 0; j < names.length; j++){
					const td = tr.appendChild(document.createElement("td"));
					td.innerText = scoreboard[j][i] || "\xa0";
				}
			}

			//End game thingy
			if(endGame){
				const p = (endGameLast + 1) % names.length;
				sbBody.children[scoreboard[p].length - 1].children[p].classList.add("beat");
			}

			//Set other things
			sbHead.children[turn].classList.add("active");
			sbBody.children[round].children[turn].classList.add("active");
			sbBody.children[round].children[turn].scrollIntoView({block: "nearest"});
			document.getElementById("turn").innerText = names[turn];
			document.body.classList.add("p" + (turn + 1));

			//Switch screen and enable playing
			document.getElementById("start").classList.add("hidden");
			document.getElementById("game").classList.remove("hidden");
			
			canPlay = true;
			resize();
		} catch(e){
			console.error(e);
		}
	}
	
	function archiveGame(){
		try {
			localStorage.setItem("save", "{}");

			/** @type {{}[]} */
			const saves = JSON.parse(localStorage.getItem("past") || "[]");
			saves.push({
				names: names,
				scoreboard: scoreboard,
				winner: turn,
				dateString: new Date().toLocaleString(),
				dateRaw: Date.now()
			});
			localStorage.setItem("past", JSON.stringify(saves));
		} catch(e){
			console.error(e);
		}
	}

	function getArchives(){
		const list = document.getElementById("pastlist");
		list.innerHTML = "";
		try {
			const archives = JSON.parse(localStorage.getItem("past") || "[]").sort((a, b) => (a.dateRaw || 0) - (b.dateRaw || 0));
			
			//Add archive summaries to list
			for(let i = 0; i < archives.length; i++){
				//Get archive
				const archive = archives[i];
				//Create a new row and put basic information from archive
				const tr = list.appendChild(document.createElement("tr"));
				tr.appendChild(document.createElement("th")).innerText = archive.dateString;
				tr.appendChild(document.createElement("td")).innerText = archive.names[archive.winner];
				tr.appendChild(document.createElement("td")).innerText = archive.scoreboard[archive.winner][archive.scoreboard[archive.winner].length - 1];
				//Put options
				const options = tr.appendChild(document.createElement("td"));
				const viewButton = options.appendChild(document.createElement("button"));
				viewButton.innerText = "View";
				viewButton.onclick = () => {
					if(getArchive(i)){
						document.getElementById("pastgames").classList.add("hidden");
						document.getElementById("pastgameview").classList.remove("hidden");
					} else {
						alert("Could not read archive!");
					}
				};
				const deleteButton = options.appendChild(document.createElement("button"));
				deleteButton.style.backgroundColor = "var(--theme-err)";
				deleteButton.innerText = "\xd7";
				deleteButton.onclick = () => {
					archives.splice(archives.indexOf(archive), 1);
					tr.remove();
					localStorage.setItem("past", JSON.stringify(archives));
				}
			}
			
			if(archives.length == 0){
				const tr = list.appendChild(document.createElement("tr"));
				const td = tr.appendChild(document.createElement("td"));
				td.setAttribute("colspan", "999");
				td.innerHTML = "<i>No past games!</i>"
			}
		} catch(e){
			console.error(e);
			const tr = list.appendChild(document.createElement("tr"));
			const td = tr.appendChild(document.createElement("td"));
			td.setAttribute("colspan", "999");
			td.innerHTML = "<i>Error reading past games!</i>";
		}
	}
	
	function getArchive(num){
		try {
			//Get archive
			const archive = JSON.parse(localStorage.getItem("past") || "[]").sort((a, b) => (a.dateRaw || 0) - (b.dateRaw || 0))[num];
			const sb = archive.scoreboard;
			document.getElementById("pastwinner").innerText = archive.names[archive.winner];
			document.getElementById("pastscore").innerText = sb[archive.winner][sb[archive.winner].length - 1];
			document.body.classList.add("p" + (archive.winner + 1));
			
			//Grab scoreboard elements and clear their contents
			const sbElem = document.getElementById("pastscoreboard");
			const sbHead = sbElem.querySelector("thead tr");
			const sbBody = sbElem.querySelector("tbody");
			
			sbHead.innerHTML = "";
			sbBody.innerHTML = "";
			
			//Add scoreboard contents
			for(let i = 0; i < archive.names.length; i++){
				const th = sbHead.appendChild(document.createElement("th"));
				th.innerText = archive.names[i];
				th.classList.add("p" + (i + 1));
			}
			
			const rows = (() => {let m = 0; for(let i = 0; i < archive.names.length; i++) m = Math.max(m, sb[i].length); return m;})();
			for(let i = 0; i < rows; i++){
				const tr = sbBody.appendChild(document.createElement("tr"));
				for(let j = 0; j < archive.names.length; j++){
					const td = tr.appendChild(document.createElement("td"));
					td.innerText = sb[j][i] || "\xa0";
					if(i == sb[archive.winner].length - 1 && j == archive.winner){
						td.classList.add("active");
					}
				}
			}
			
			return true;
		} catch(e){
			console.error(e);
			return false;
		}
	}
	
	//#endregion
	///////////////////////////////////////////////////////////////////////////////////////////////////////////
	///////////////////////////////////////////////////////////////////////////////////////////////////////////
	// Particle and page resize functions
	//#region
	
	function resize(){
		//Resize canvas to fit screen size
		const d = document.body.getBoundingClientRect();
		const canv = document.getElementById("particles");
		const oldW = canv.width;
		const oldH = canv.height;
		canv.width = d.width;
		canv.height = d.height;
		
		//Resize dice as well
		const b = document.getElementById("board").getBoundingClientRect();
		const boardMin = Math.min(b.width, b.height);
		for(let i = 0; i < 5; i++){
			dice[i].el.width = boardMin / 7;
			dice[i].el.height = boardMin / 7;
			dice[i].draw();
			
			if(document.getElementById("game").classList.contains("hidden")) continue;
			
			dice[i].x = dice[i].x / oldW * d.width;
			dice[i].y = dice[i].y / oldH * d.height;
			
			if(dice[i].el.style.transform !== "")
				dice[i].el.style.transform = "translate(" + dice[i].x + "px, " + dice[i].y + "px)" + (/ rotate\([\d.]+deg\)/gm.exec(dice[i].el.style.transform)[0]);
		}
	}
	window.onresize = resize;
	resize();
	
	//HSL to Hexadecimal
	function hslToHex(h, s, l) {
		l /= 100;
		const a = s * Math.min(l, 1 - l) / 100;
		const f = n => {
			const k = (n + h / 30) % 12;
			const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
			return Math.round(255 * color).toString(16).padStart(2, '0');   // convert to Hex and prefix "0" if needed
		};
		return "#" + f(0) + f(8) + f(4);
	}
	
	//Set up some variables for particles
	const canv = document.getElementById("particles");
	const ctx = canv.getContext("2d");
	const particles = [];
	let particleDrawing = false;
	
	function confetti(){
		if(canv.classList.contains("hidden")) return;
		
		//Set up some important variables and classes
		const PXVSF = 0.3; //particle x-velocity scaling factor
		
		class ConfettiParticle {
			d = 5; //default minimum side length for rectangles
			
			constructor(x, y, a, xv, yv, av, r, s, c){
				//Positions and rotations
				this.x = x;
				this.y = y;
				this.a = a; //angle
				//Velocities
				this.xv = xv;
				this.yv = yv;
				this.av = av;
				//Visuals
				this.r = r; //size ratio
				this.s = s; //size scaling
				this.c = c; //color
			}
			
			tick(delta){
				//Update positions
				this.x += this.xv * delta;
				this.y += this.yv * delta;
				this.a += this.av * delta;
				//Update xv (other velocities stay the same throughout)
				this.xv *= PXVSF ** delta;
				//Return whether we want to keep this
				return this.y < canv.height;
			}
			
			draw(){
				//Save canvas things for later
				ctx.save();
				//Transformations
				ctx.translate(this.x, this.y);
				ctx.scale(this.s, this.s);
				ctx.rotate(this.a);
				//Create rectangle
				ctx.fillStyle = this.c;
				let w = this.r > 1 ? this.d * this.r : this.d;
				let h = this.r < 1 ? this.d * (1/this.r) : this.d;
				ctx.fillRect(-w/2, -h/2, w, h);
				//Restore canvas to as it was before
				ctx.restore();
			}
		}
		
		const PMXV = -canv.width / Math.log(PXVSF); //particle max x-velocity, figured out using calculus
		
		//Create the particle instances
		for(let i = 0; i < canv.width / 2; i++){ //canv.width / 2 is the number of confetti particles created
			particles.push(new ConfettiParticle(
				canv.width / 2,                                    //x, set to middle of screen
				Math.random() * -50,                               //y, set to top of screen
				Math.random() * Math.PI,                           //angle, between 0 and 180 deg (looks same after)
				Math.random() * PMXV * 2 - PMXV,                   //x velocity, figures out velocity needed to travel to one side of screen
				Math.random() * canv.height / 2 + canv.height / 4, //y velocity with speeds relative to actual height
				Math.random() * Math.PI * 2 - Math.PI,             //angle velocity, between -180 and 180 deg/sec
				Math.random() * 2 + 0.25,                          //size ratio, between 0.5 and 2, which is self-similar
				Math.random() * 1.5 + 0.5,                         //size scaling, between 0.5 and 2
				(() => hslToHex(Math.random() * 360, 100, 75))()   //color
			));
		}
		
		//If there's not already an instance of us drawing particles, start drawing things
		if(!particleDrawing){
			window.requestAnimationFrame(draw);
			particleDrawing = true;
		}
	}
	
	//Drawing function
	let lt = 0; //last t
	function draw(t){
		if(lt === 0) lt = t;
		//For the first frame, delta will be 0
		const delta = (t - lt) / 1000;
		lt = t;
		//Clear previous
		ctx.clearRect(0, 0, canv.width, canv.height);
		//Draw
		let copy = [...particles];
		for(let i = copy.length - 1; i >= 0; i--){
			//Draw particles in reverse order so we don't skip any if we delete them (if they reach the bottom)
			let p = copy[i];
			if(p.tick(delta))
				p.draw();
			else
				particles.splice(i, 1);
		}
		//See if we need to draw again
		if(particles.length > 0){
			window.requestAnimationFrame(draw);
		} else {
			//If we don't, signal that we can create a new confetti loop (since this will now be dead)
			particleDrawing = false;
			lt = 0;
		}
	}
	//#endregion
})();
