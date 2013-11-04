var blackTimer, whiteTimer, game;

$(document).ready(function() {
	game = go("chart", onSwitch, showAlert);
	$("#startButton").click(function() {
		game.mode("play").currentPlayer(false).start();
		$("#startButton").removeClass("btn-primary");
		$("#blackIndicator").addClass("icon-hand-up");
		blackTimer = timer("blackTimer");
		whiteTimer = timer("whiteTimer");
		blackTimer.start();
		$("#startButton").css("display", "none");
		$("#config").css("display", "none");
		$("#retractButton").css("display", "inline");
		$("#forwardButton").css("display", "inline");
	});

	$("#retractButton").click(function() {
		game.retract();
	});

	$("#forwardButton").click(function() {
		game.forward();
	});

	$("#configMenu").click(function() {
		$("#setup").css("display", "block");
		$("#control").css("display", "none");
		game.mode("setup").currentPlayer(false).start();
	});

	$("#backSetupButton").click(function() {
		game.retract();
	});

	$("#endSetupButton").click(function() {
		$("#setup").css("display", "none");
		$("#control").css("display", "block");
		game.end().mode("play");
	});

	$("#setupBlack").click(function() {
		game.currentPlayer(true);
	});

	$("#setupWhite").click(function() {
		game.currentPlayer(false);
	});

	//TODO
	//Not Ready for report
	$("#reportButton").click(function() {
		var svg = $("<div>").append($("#chart svg").clone()).html();
		//On Screen Canvas Sample
		var c = document.getElementById('canvas');
		var ctx = c.getContext('2d');
		ctx.drawSvg(svg, 0, 0, 300, 300);
		$("#report").modal("show");
	});
});

function onSwitch(e) {
	if (!blackTimer || !whiteTimer) {
		return;
	}
	if (e) {
		$("#blackIndicator").removeClass("icon-hand-up");
		$("#whiteIndicator").addClass("icon-hand-up");
		blackTimer.pause();
		whiteTimer.start();
	} else {
		$("#whiteIndicator").removeClass("icon-hand-up");
		$("#blackIndicator").addClass("icon-hand-up");
		whiteTimer.pause();
		blackTimer.start();
	}
}

function showAlert(alert) {
	var mes = d3.select("#info").append("div").classed("alert offset1", true);
	mes.append("button").attr("type", "button").attr("data-dismiss", "alert").classed("close", true).text("x");
	mes.append("strong").text("警告");
	mes.append("div").text(alert);
	setTimeout(function() {
		mes.data([]).exit().transition().remove();
	}, 5000);
}

function getBitmapData(svg, width, height) {
	var buffer = document.createElement('canvas');
	buffer.width = width;
	buffer.height = height;
	ctx = buffer.getContext('2d');
	ctx.drawSvg(svg, 0, 0, width, height);
	var dataUrl = buffer.toDataURL();
	return dataUrl;
}

function onReport() {
	var svg = $("<div>").append($("#chart").clone()).html();
	//On Screen Canvas Sample
	var c = document.getElementById('canvas');
	var ctx = c.getContext('2d');
	ctx.drawSvg(svg, 0, 0, 100, 100);
	$("#chartBitmapCode").val(getBitmapData(svg, $("#chart").width(), $("#chart").height()));
}

function timer(view) {
	var se, m = 0,
		h = 0,
		s = 0,
		ss = 1,
		t, aTimer = {};

	function second() {
		if ((ss % 10) == 0) {
			s += 1;
			ss = 1;
		}
		if (s > 0 && (s % 60) == 0) {
			m += 1;
			s = 0;
		}
		if (m > 0 && (m % 60) == 0) {
			h += 1;
			m = 0;
		}
		t = h + ":" + m + ":" + s + ":" + ss;
		$("#" + view).text(t);
		ss += 1;
	}

	aTimer.start = function() {
		se = setInterval(function() {
			second();
		}, 100);
	}
	aTimer.pause = function() {
		clearInterval(se);
	}
	aTimer.stop = function() {
		clearInterval(se);
		ss = 1;
		m = h = s = 0;
	}
	return aTimer;
}