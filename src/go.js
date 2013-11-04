function go(view, onswitch, onerror) {
	var off = 30,
		w = 30,
		boardSize = 600;
	var data = []; //store the piece data
	var history = []; //store history data;
	var future = []; //store future steps when backword play;
	var current = false;
	var currentKill = null;
	var playTime = null;
	var game = {};
	var changePlayer = onswitch; //callback when finish current player's play
	var showError = onerror;
	var configuration = {};
	configuration.isShowShadow = true;
	configuration.mode = "play"; //play: normal play, setup: setup mode for pre-configuration

	var div = d3.select("#" + view);
	var svg = div.append("svg").attr("width", boardSize).attr("height", boardSize)
		.attr("x", 100).attr("y", 100);
	//base group for all;
	var base = svg.append("svg:g").classed("base", true);
	initialize();
	drawBoard(base);

	game.start = function() {
		var length = 18,
			wh = w * length;
		var eventLayer = d3.select("#board").select(".eventLayer");
		if (eventLayer.empty()) {
			eventLayer = base.append("g").attr("transform", "translate(" + off + "," + off + ")").classed("eventLayer", true);
		}
		//binding click with an opacity layer
		eventLayer.append("rect").attr("x", 0 - off).attr("y", 0 - off).attr("width", wh + off * 2).attr("height", wh + off * 2).style("fill-opacity", 0).on("click", function() {
			var offX = d3.mouse(this)[0] / w;
			var offY = d3.mouse(this)[1] / w;
			play(Math.round(offX), Math.round(offY));
		});

		if (configuration.isShowShadow) {
			eventLayer.on("mousemove", function() {
				var offX = d3.mouse(this)[0] / w;
				var offY = d3.mouse(this)[1] / w;
				if (configuration.mode === "play") {
					drawShadow(Math.round(offX), Math.round(offY), !current);
				} else {
					drawShadow(Math.round(offX), Math.round(offY), current);
				}
			}).on("mouseout", function() {
				$(".shadow").remove();
			});
		}
		playTime = new Date();
		return game;
	}

	game.end = function() {
		$(".eventLayer").remove();
		$(".shadow").remove();
		return game;
	}

	game.retract = function() {
		backward();
		return game;
	}

	game.forward = function() {
		forward();
		return game;
	}

	game.dump = function() {
		var dumpData = {};
		dumpData.d = data;
		dumpData.history = history;
		return JSON.stringify(dumpData);
	}

	game.setup = function(gameData) {
		var i, length;
		if (gameData.black) {
			length = gameData.black.length;
			for (i = 0; i < length; i++) {
				drawPiece(gameData.black[i].x, gameData.black[i].y, true);
				data[gameData.black[i].x][gameData.black[i].y].piece = true;
			}
		}

		if (gameData.white) {
			length = gameData.white.length;
			for (i = 0; i < length; i++) {
				drawPiece(gameData.white[i].x, gameData.white[i].y, false);
				data[gameData.white[i].x][gameData.white[i].y].piece = false;
			}
		}
		return game;
	}

	game.currentPlayer = function(value) {
		if (!arguments.length) {
			return current;
		}
		current = value;
		return game;
	}

	game.mode = function(mode) {
		if (!arguments.length) {
			return configuration.mode;
		}
		configuration.mode = mode;
		return game;
	}

	return game;


	function drawBoard(base) {
		var i = 0,
			length = 18,
			wh = w * length;
		var board = base.append("g").attr("transform", "translate(" + off + "," + off + ")").attr("id", "board");

		//horizontal line
		var x1 = 0,
			x2 = wh,
			y = 0;
		for (; i < length + 1; i++) {
			board.append("line").attr("x1", x1).attr("y1", y).attr("x2", x2).attr("y2", y).style("stroke", "black").style("stroke-width", 1);
			y = y + w;
		}

		//vertical line
		i = 0, x = 0, y1 = 0, y2 = wh;
		for (; i < length + 1; i++) {
			board.append("line").attr("x1", x).attr("y1", y1).attr("x2", x).attr("y2", y2).style("stroke", "black").style("stroke-width", 1);
			x = x + w;
		}

		//draw stars
		var starData = [];
		starData.push([3, 3]);
		starData.push([3, 9]);
		starData.push([3, 15]);
		starData.push([9, 3]);
		starData.push([9, 9]);
		starData.push([9, 15]);
		starData.push([15, 3]);
		starData.push([15, 9]);
		starData.push([15, 15]);

		board.selectAll("circle").data(starData).enter().append("circle").attr("cx", function(d) {
			return d[0] * w;
		}).attr("cy", function(d) {
			return d[1] * w;
		}).attr("r", 3).style("stroke", "black").style("stroke-width", 1);

		//draw col/raw no. text
		x = 0, y = 0, i = 0;
		for (; i < length + 1; i++) {
			board.append("text").attr("x", x - 4).attr("y", y - 14).text(i + 1).style("stroke", "black").style("stroke-width", 1);
			x = x + w;
		}

		x = 0, y = 0, i = 0;
		for (; i < length + 1; i++) {
			board.append("text").attr("x", x - 30).attr("y", y + 4).text(i + 1).style("stroke", "black").style("stroke-width", 1);
			y = y + w;
		}

	}

	function initialize() {
		var i = 0,
			j, length = 19;
		for (; i < length; i++) {
			var d = [];
			data.push(d);
			j = 0
			for (; j < length; j++) {
				var o = {};
				o.col = i;
				o.row = j;
				o.piece = null; // true black, false white, null no piece 
				d.push(o);
			}
		}
	}

	function play(col, row) {
		var currentPiece = data[col][row];
		var step = {};
		if (currentPiece.piece !== null) {
			console.log("Cannot put on exist piece!")
			return;
		}

		if (configuration.mode === "play") {
			current = !current;
		}

		currentPiece.piece = current;
		if (plunder(col, row) || breath(col, row)) {
			currentPiece.piece = null;
			current = !current;
			return;
		}

		drawPiece(col, row, current);
		playSound();

		step.x = col;
		step.y = row;
		step.piece = current;
		step.kill = currentKill;
		step.time = new Date() - playTime;
		history.push(step);
		currentKill = null;
		playTime = new Date();

		if (changePlayer) {
			changePlayer(current);
		}
	}

	function backward() {
		var lastStep = history.pop();
		if (!lastStep) {
			return;
		}
		var block = [],
			killBlock = lastStep.kill;

		block.push({
			x: lastStep.x,
			y: lastStep.y
		});
		remove(block);

		//Recover kill block
		if (killBlock) {
			for (i = 0; i < killBlock.length; i++) {
				drawPiece(killBlock[i].x, killBlock[i].y, !lastStep.piece);
				data[killBlock[i].x][killBlock[i].y].piece = !lastStep.piece;
			}
		}

		future.push(lastStep);

		if (configuration.mode === "play") {
			current = !current;
			if (changePlayer) {
				changePlayer(current);
			}
		}

	}

	function forward() {
		var nextStep = future.pop();
		if (!nextStep) {
			return;
		}

		play(nextStep.x, nextStep.y);
	}

	function getId(x, y) {
		return "p_" + x + "_" + y;
	}

	function drawPiece(col, row, piece) {
		var board = d3.select("#board");
		var piece = board.append("circle").classed("piece", true).attr("cx", col * w).attr("cy", row * w).attr("r", w / 2 - 2).style("fill", piece ? "black" : "white");
		piece.data({
			x: col,
			y: row,
			piece: current
		});
		piece.attr("id", getId(col, row));
	}

	function drawShadow(col, row, piece) {
		var board = d3.select("#board");
		var shadow = board.select(".shadow");
		if (shadow.empty()) {
			shadow = board.append("circle").classed("shadow", true).attr("cx", col * w).attr("cy", row * w).attr("r", w / 2 - 2).style("fill", piece ? "black" : "white").style("fill-opacity", 0.5);
		} else {
			shadow.attr("cx", col * w).attr("cy", row * w).attr("r", w / 2 - 2).style("fill", piece ? "black" : "white").style("fill-opacity", 0.5);
		}
	}

	function playSound() {
		$("embed").remove();
		$.playSound("resources/click.wav");
	}

	function breath(col, row) {
		//TODO : performace improvement

		function inBlock(x, y, block) {
			var i = 0,
				length = block.length;
			for (; i < length; i++) {
				var o = block[i];
				if (o.x === x && o.y === y) {
					return true;
				}
			}
			return false;
		}

		//检查还剩几口气

		function breath(col, row, piece) {
			var queue = [],
				block = [];
			var result = {};
			result.breath = 0;
			queue.push({
				x: col,
				y: row
			});
			block.push({
				x: col,
				y: row
			});
			while (true) {
				var p = queue.pop();
				if (!p) {
					break;
				}
				for (var dx = -1; dx <= 1; dx++) {
					for (var dy = -1; dy <= 1; dy++) {
						if (!dx ^ !dy) {
							var x = p.x + dx,
								y = p.y + dy;
							if (x >= 0 && y >= 0 && x < 19 && y < 19) {
								if (data[x][y].piece === null) {
									result.breath++;
									if (result.breath >= 2) {
										return null;
									}
								} else if (data[x][y].piece === piece) {
									if (!inBlock(x, y, block)) {
										queue.push({
											x: x,
											y: y
										});
										block.push({
											x: x,
											y: y
										});
									}
								}
							}
						}
					}
				}
			}
			result.block = block;
			return result;
		}

		//如果是对方的最后一口气，则杀棋
		var killBlock = [];
		for (var dx = -1; dx <= 1; dx++) {
			for (var dy = -1; dy <= 1; dy++) {
				if (!dx ^ !dy) {
					var x = col + dx,
						y = row + dy;
					if (x >= 0 && y >= 0 && x < 19 && y < 19) {
						if (data[x][y].piece !== null && data[x][y].piece === !current && !inBlock(x, y, killBlock)) {
							var kr = breath(x, y, !current);
							if (kr !== null && kr.breath === 0) {
								killBlock = killBlock.concat(kr.block);
							}
						}
					}
				}
			}
		}

		if (killBlock.length > 0) {
			remove(killBlock);
			currentKill = killBlock;
			return false;
		}

		//如果是自己的最后一口气，则为禁手，返回true
		var r = breath(col, row, current);
		if (r && r.breath === 0) {
			showInvalid("不够气");
			return true;
		}

		return false;
	}

	function remove(block) {
		//console.log(block);
		var i = 0,
			length = block.length;
		for (; i < length; i++) {
			var o = block[i],
				id = getId(o.x, o.y);
			var killPiece = d3.select("#" + id);
			//Add a transition here ?
			killPiece.transition().attr("r", 0);
			killPiece.data([]).exit().transition().delay(500).remove();
			data[o.x][o.y].piece = null;
		}
	}

	function plunder(col, row) {
		var length = history.length,
			lastStep = history[length - 1];

		if (!lastStep) {
			return false;
		}

		if (!lastStep.kill || lastStep.kill.length > 1) {
			return false;
		}

		var lastKill = lastStep.kill[0];

		if (lastKill.x === col && lastKill.y === row) {
			showInvalid("打劫");
			return true;
		}

		return false;
	}

	function showInvalid(message) {
		showError("禁手:" + message);
	}

	function zoom(position, scale) {
		if (position === "bl") { //bottom left
			var yOff = boardSize - boardSize / scale;
			base.attr("transform", "scale(" + scale + ")" + " translate(" + 0 + ",-" + yOff + ")");
		} else if (position === "tl") { //top left
			base.attr("transform", "scale(" + scale + ")");
		} else if (position === "tr") { //top right
			var xOff = boardSize - boardSize / scale;
			base.attr("transform", "scale(" + scale + ")" + " translate(-" + xOff + "," + 0 + ")");
		} else if (position === "br") { //bottom right
			var xOff = boardSize - boardSize / scale;
			var yOff = boardSize - boardSize / scale;
			base.attr("transform", "scale(" + scale + ")" + " translate(-" + xOff + ",-" + yOff + ")");
		}
	}
}