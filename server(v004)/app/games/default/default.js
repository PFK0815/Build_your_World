createItem("default:air", {itemname:{"en-US":"air", "de-DE":"Luft"}, unbreakable:true, notInInventory:true, block:true, style:'background-color: #000000;', canOverPlace:true});
createItem("default:infiniBlock", {itemname:{"en-US":"infinity Block", "de-DE":"Unendlicher Block"}, notInInventory:true, block:true, style:'background: url("./games/default/textures/infiniBlock.png");', drop:[["default:stone", 1],["default:dirt", 2],["default:oakLog", 2]], events:{}});
createItem("default:stone", {itemname:{"en-US":"stone", "de-DE":"Stein"}, block:true, style:'background: url("./games/default/textures/stone.png");'});
createItem("default:grass", {itemname:{"en-US":"grass", "de-DE":"Gras"}, block:true, style:'background: url("./games/default/textures/grass.png");', makeItemsNeeded:["default:dirt 4"]});
createItem("default:dirt", {itemname:{"en-US":"dirt", "de-DE":"Erde"}, block:true, style:'background: url("./games/default/textures/dirt.png");'});
createItem("default:oakPlanks", {itemname:{"en-US":"oak planks", "de-DE":"Eichenholzbretter"}, block:true, style:'background: url("./games/default/textures/oakPLANKS.png");', makeItemsNeeded:["default:oakLog 1"]});
createItem("default:oakLog", {itemname:{"en-US":"oak log", "de-DE":"Eichenholzstamm"}, block:true, style:'background: url("./games/default/textures/oakLOG.png");'});
var autoSaveInterval = null;
createCommand("save", {
	description:"Speichert die Welt.",
	NeededAllow:"SERVERADMIN",
	func:function(){
		saveServer(true);
		return "Welt wurde gespeichert!";
	}
});
createCommand("GetRawUser", {
	description:"Zeigt das JSON eines Spielers an. !CMD GetRawUser [Spielername]",
	NeededAllow:"SERVERADMIN",
	func:function(commandARGS){
		if(!bywSERVER.players[commandARGS]) return `${commandARGS} ist nicht registriert!`;
		return JSON.stringify(bywSERVER.players[commandARGS], true, 4).replaceAll("\n", "<br/>").replaceAll(" ", "&nbsp;");
	}
});
createCommand("kick", {
	description:"Kickt einen Spieler. !CMD kick [Spielername] [Grund]",
	NeededAllow:"kick",
	func:function(commandARGS){
		var spaceindex = commandARGS.indexOf(" ");
		var user = "";
		var grund = "Adminstrastorkick!";
		if(spaceindex >= 0){
			user = commandARGS.substring(0, spaceindex);
			grund = commandARGS.substring(spaceindex+1);
		}else{
			user = commandARGS;
		}
		if(!onlinePlayers[user]) return `${user} ist nicht online!`;
		onlinePlayers[user].send(JSON.stringify({type:"JSalert", text:"Du wurdest gekickt. Grund: "+grund}));
		onlinePlayers[user].terminate();
		return `${user} wurde gekickt.`;
	}
});
createCommand("ban", {
	description:"Bannt einen Spieler. !CMD ban [Spielername] [Grund]",
	NeededAllow:"ban",
	func:function(commandARGS){
		var spaceindex = commandARGS.indexOf(" ");
		var user = "";
		var grund = "Adminstrastorban!";
		if(spaceindex >= 0){
			user = commandARGS.substring(0, spaceindex);
			grund = commandARGS.substring(spaceindex+1);
		}else{
			user = commandARGS;
		}
		if(grund == "false"){
			grund = false;
			bywSERVER.players[user].banned = grund;
			return `Ban auf ${user} wurde zurückgenommen.`;
		}
		bywSERVER.players[user].banned = grund;
		if(onlinePlayers[user] && grund){
			onlinePlayers[user].send(JSON.stringify({type:"JSalert", text:"Du wurdest gebannt. Grund: "+grund}));
			onlinePlayers[user].terminate();
		}
		return `${user} wurde gebannt.`;
	}
});
createCommand("allow", {
	description:"Gibt einen Spieler Rechte. !CMD allow [Spielername] [Recht]",
	NeededAllow:"Allower",
	func:function(commandARGS){
		var spaceindex = commandARGS.indexOf(" ");
		var user = "";
		var recht = "";
		if(spaceindex < 0) return "Name und Recht benötigt!"
		user = commandARGS.substring(0, spaceindex);
		recht = commandARGS.substring(spaceindex+1);
		if(!bywSERVER.players[user].Allowed.includes(recht)){
			bywSERVER.players[user].Allowed.push(recht);
		}
		return `${user} hat folgende Rechte: ${bywSERVER.players[user].Allowed.toString().replaceAll(",", ",&nbsp;")}`
	}
});
createCommand("deny", {
	description:"Entzieht einen Spieler Rechte. !CMD deny [Spielername] [Recht]",
	NeededAllow:"Allower",
	func:function(commandARGS){
		var spaceindex = commandARGS.indexOf(" ");
		var user = "";
		var recht = "";
		if(spaceindex < 0) return "Name und Recht benötigt!"
		user = commandARGS.substring(0, spaceindex);
		recht = commandARGS.substring(spaceindex+1);
		if(bywSERVER.players[user].Allowed.includes(recht)){
			delete bywSERVER.players[user].Allowed[bywSERVER.players[user].Allowed.indexOf(recht)];
			bywSERVER.players[user].Allowed = filterArray(bywSERVER.players[user].Allowed);
		}
		return `${user} hat folgende Rechte: ${bywSERVER.players[user].Allowed.toString().replaceAll(",", ",&nbsp;")}`
	}
});
createCommand("AllowList", {
	description:"Zeigt die Rechte eines Spielers. !CMD AllowList [Spielername]",
	NeededAllow:false,
	func:function(commandARGS){
		if(!commandARGS) return "Bitte Nutzername angeben!";
		if(!bywSERVER.players[commandARGS]) return "Nutzername nicht registriert!";
		return `${commandARGS} hat folgende Rechte: ${bywSERVER.players[commandARGS].Allowed.toString().replaceAll(",", ",&nbsp;")}`
	}
});
createCommand("DN", {
	description:"Direktnachricht an Spieler. !CMD DN [Spielername] [Nachricht]",
	NeededAllow:false,
	func:function(commandARGS, PLAYER){
		var spaceindex = commandARGS.indexOf(" ");
		var user = "";
		var nachricht = "";
		if(spaceindex < 0) return "Name und Nachricht benötigt!"
		user = commandARGS.substring(0, spaceindex);
		nachricht = commandARGS.substring(spaceindex+1);
		if(!bywSERVER.players[PLAYER].Allowed.includes("NOCHATSECURITY")){
			nachricht = nachricht.replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll("\"", "&quot;").replaceAll(" ", "&nbsp;");
		}
		if(!onlinePlayers[user]) return `${user} ist nicht online!`;
		onlinePlayers[user].send(JSON.stringify({type:"Chat", msg:`<span style='color:#0000FF;'>DN von ${PLAYER}: ${nachricht}</span>`}));
		log(`DN von ${PLAYER} an ${user}: ${nachricht}`);
		if(onlinePlayers[ADMINNAME]){
			onlinePlayers[ADMINNAME].send(JSON.stringify({type:"Chat", msg:`<span style='color:#FF0000;'>DN von ${PLAYER} an ${user}: ${nachricht}</span>`}));
		}
		return `DN an ${user}: ${nachricht}`;
	}
});
createCommand("gift", {
	description:"Fuegt Bloecke in das Inventar eines Spielers ein. !CMD gift [Spielername] [itemID] [Anzahl]",
	NeededAllow:"gift",
	func:function(commandARGS){
		var spaceindex = commandARGS.indexOf(" ");
		var user = "";
		var item = "";
		if(spaceindex < 0) return "Spieler und item benötigt!"
		user = commandARGS.substring(0, spaceindex);
		item = commandARGS.substring(spaceindex+1);
		var [itemid, itemcount] = item.split(" ");
		if(!allItems[itemid]) return "Kann kein undefiniertes Item geben!";
		if(!onlinePlayers[user]) return `${user} ist nicht online!`;
		if(!bywSERVER.players[user].inventory[itemid]) bywSERVER.players[user].inventory[itemid] = 0;
		bywSERVER.players[user].inventory[itemid] += +itemcount;
		onlinePlayers[user].send(JSON.stringify({type:"UpdateInventoryITEMONLY", itemid, count:bywSERVER.players[user].inventory[itemid]}));
		return `${itemcount} ${allItems[itemid].itemname} an ${user} gegeben.`;
	}
});
createCommand("give", {
	description:"Gib anderen Spielern Items aus deinem Inventar. !CMD give [Spielername] [itemID] [Anzahl]",
	NeededAllow:false,
	func:function(commandARGS, PLAYER, PLAYERclient){
		var spaceindex = commandARGS.indexOf(" ");
		var user = "";
		var item = "";
		if(spaceindex < 0) return "Spieler und item benötigt!"
		user = commandARGS.substring(0, spaceindex);
		item = commandARGS.substring(spaceindex+1);
		var [itemid, itemcount] = item.split(" ");
		if(!allItems[itemid]) return "Kann kein undefiniertes Item geben!";
		if(bywSERVER.players[PLAYER].inventory[itemid] < itemcount) return "Nicht genug in deinem Inventar!";
		if(!onlinePlayers[user]) return `${user} ist nicht online!`;
		if(!bywSERVER.players[user].inventory[itemid]) bywSERVER.players[user].inventory[itemid] = 0;
		bywSERVER.players[user].inventory[itemid] += +itemcount;
		bywSERVER.players[PLAYER].inventory[itemid] -= +itemcount;
		onlinePlayers[user].send(JSON.stringify({type:"UpdateInventoryITEMONLY", itemid, count:bywSERVER.players[user].inventory[itemid]}));
		PLAYERclient.send(JSON.stringify({type:"UpdateInventoryITEMONLY", itemid, count:bywSERVER.players[PLAYER].inventory[itemid]}));
		return `${itemcount} ${allItems[itemid].itemname} an ${user} gegeben.`;
	}
});
createCommand("DELETEME", {
	description:"LOESCHT deinen Benutzer UNWIEDERUFLICH vom Server! Beim Attribute eingeben 'I NEVER CAN TAKE IT BACK!!!'. !CMD DELETEME (I NEVER CAN TAKE IT BACK!!!)",
	NeededAllow:false,
	func:function(commandARGS, PLAYER, PLAYERclient){
		if(commandARGS == "I NEVER CAN TAKE IT BACK!!!"){
			delete bywSERVER.players[PLAYER];
			PLAYERclient.terminate();
		}
		return "Bitte mit 'I NEVER CAN TAKE IT BACK!!!' ausfuehren!";
	}
});
createCommand("DELETE", {
	description:"LOESCHT einen Benutzer UNWIEDERUFLICH vom Server! !CMD DELETEME [Spielername]",
	NeededAllow:"SERVERADMIN",
	func:function(commandARGS, PLAYER, PLAYERclient){
		if(bywSERVER.players[commandARGS]){
			if(!onlinePlayers[commandARGS]){
				delete bywSERVER.players[commandARGS];
				return "Geloescht!";
			}else{
				return "Nur Spieler die offline sind, koennen geloescht werden!"
			}
		}else{
			return "Spieler nicht gefunden!"
		}
	}
});
createCommand("autoSaveON", {
	description:"Schaltet automtisches Speichern des Servers an. !CMD autoSaveON [Zeit in Minuten]",
	NeededAllow:"SERVERADMIN",
	func:function(commandARGS, PLAYER, PLAYERclient){
		var saveIntervalTimeinMS = 1000*60*commandARGS;
		if(autoSaveInterval != null){
			return "Automatisches Speichern ist bereits angeschaltet!";
		}
		autoSaveInterval = setInterval(saveServer, saveIntervalTimeinMS);
		bywSERVER.WORLDSETTINGS.autoSaveInterval = +commandARGS;
		return "Automatisches Speichern wurde angeschaltet.";
	}
});
createCommand("autoSaveOFF", {
	description:"Schaltet automtisches Speichern des Servers aus. !CMD autoSaveOFF",
	NeededAllow:"SERVERADMIN",
	func:function(commandARGS, PLAYER, PLAYERclient){
		if(autoSaveInterval != null){
			clearInterval(autoSaveInterval);
			autoSaveInterval = null;
			bywSERVER.WORLDSETTINGS.autoSaveInterval = false;
			return "Automatisches Speichern wurde ausgeschaltet.";
		}
		return "Automatisches Speichern ist bereits ausgeschaltet!"
	}
});
createCommand("autoSaveSTAT", {
	description:"Zeigt Status vom Server auto-save. !CMD autoSaveSTAT",
	NeededAllow:"SERVERADMIN",
	func:function(commandARGS, PLAYER, PLAYERclient){
		if(autoSaveInterval != null){
			return "Automatisches Speichern ist angeschaltet.";
		}
		return "Automatisches Speichern ist ausgeschaltet!"
	}
});
createCommand("setblock", {
	description:"Setzt Block an koordinaten. !CMD setblock [y] [x] [blockid]",
	NeededAllow:"maphack",
	func:function(commandARGS, PLAYER, PLAYERclient){
		var [y, x, blockID] = commandARGS.split(" ");
		if(!blockID) return "Bitte 3 Parameter!";
		if(!allItems[blockID].block) return "Bitte eine BlockID angeben!";
		bywSERVER.map[y][x] = blockID;
		clients.forEach(client => {
			client.send(JSON.stringify({type:"BlockChange", coord:[y,x], newID:bywSERVER.map[y][x]}));
		});
		return "Block wurde geaendert."
	}
});
createCommand("shutdown", {
	description:"Schaltet Server aus. !CMD shutdown",
	NeededAllow:"SERVERADMIN",
	func:function(commandARGS, PLAYER, PLAYERclient){return shutdown(PLAYER)}
});
createCommand("restart", {
	description:"Startet Server neu. !CMD restart",
	NeededAllow:"SERVERADMIN",
	func:function(commandARGS, PLAYER, PLAYERclient){return restart(PLAYER)}
});
createCommand("admin", {
	description:"Zeigt Name des Admins an. !CMD admin",
	func:function(commandARGS, PLAYER, PLAYERclient){return ADMINNAME}
});
createCommand("online", {
	description:"Zeigt Spieler die online sind an. !CMD online",
	func:function(commandARGS, PLAYER, PLAYERclient){
		var returnARRAYREAL = [];
		var returnARRAY = Object.entries(JSON.parse(JSON.stringify(onlinePlayers)));
		returnARRAY.forEach((elem) => {
			if(typeof elem[0] === "string") returnARRAYREAL.push(elem[0]);
		});
		return returnARRAYREAL.toString().replaceAll(",", ",&nbsp;");
	}
});
createCommand("tmpLogin", {
	description:"Verschaft Admins temporaeren Zugriff auf Spieleraccounts. !CMD tmpLogin [SPIELERNAME]|[TEMPORAERES PASSWORT]",
	NeededAllow:"SERVERADMIN",
	func:function(commandARGS, PLAYER, PLAYERclient){
		var [ player, tmpPWD ] = commandARGS.split("|");
		if(!(player && tmpPWD)) return "Bitte richtiges Format nutzen!";
		loginList[player] = md5(`USER"${player}"WITHPWDHASHmd5("${md5(tmpPWD)}")`);
		return "Zugriff gewaehrt."
	}
});
createCommand("SHOWtmpLogin", {
	description:"Zeigt Zugriffe auf Temporaere Logins. !CMD SHOWtmpLogin",
	NeededAllow:"SERVERADMIN",
	func:function(commandARGS, PLAYER, PLAYERclient){
		return JSON.stringify(loginList);
	}
});
createCommand("CLEARtmpLogin", {
	description:"Clear temporaere LoginList. !CMD CLEARtmpLogin",
	NeededAllow:"SERVERADMIN",
	func:function(commandARGS, PLAYER, PLAYERclient){
		loginList = {};
		return "tmpLogin-Liste wurde geleert.";
	}
});
createCommand("help", {
	description:"Zeige Hilfe an.",
	NeededAllow:false,
	func:function(){
		var returnstring = "Alle Befehle nutzen ein &quot;!CMD&nbsp;&quot;+Befehl layout.<br />";
		Object.entries(JSON.parse(JSON.stringify(allCommands))).forEach(command => {
			returnstring += `!CMD ${command[0]}(${(command[1].NeededAllow ? `Benoetigt: ${command[1].NeededAllow}` : "Ohne Recht ausfuehrbar")}): ${command[1].description || "Keine Beschreibung"}`;
			returnstring += "<br />";
		});
		return returnstring;
	}
});
if(bywSERVER.map.length <= 1){
	for(var y = 0; y < 101; y++){
		bywSERVER.map[y] = new Array();
		for(var x = 0; x < 101; x++){
			bywSERVER.map[y][x] = "default:air";
			//newRow.innerHTML += "<td id=\""+`y${y}x${x}`+"\" class='block' blockID='default:air' onmousemove='blockEvents.mouseenter(this, event)' oncontextmenu='setBlock(this, event);event.preventDefault();event.preventDefault();' onmousedown='mousedown(this, event);event.preventDefault();event.preventDefault();' onmouseup='mouseup(this, event);event.preventDefault();event.preventDefault();'></td>";
		}
	}
	bywSERVER.map[0][0] = "default:infiniBlock";
}
blockEvents.afterBreakBlock = (coord, PLAYER, PLAYERclient, beforeBlockID) => {
	bywSERVER.map[coord[0]][coord[1]] = "default:air";
	if(beforeBlockID == "default:infiniBlock"){
		bywSERVER.map[coord[0]][coord[1]] = "default:infiniBlock";
	}
};

function base64PIC(fileurl){
	const fs = require('fs');
	const imagePath = fileurl;
	const imageBuffer = fs.readFileSync(imagePath);
	const base64Image = imageBuffer.toString('base64');
	const dataUrl = `data:image/png;base64,${base64Image}`;
	return dataUrl;
}
addResourceList(`./games/default/textures/stone.png`, base64PIC("./app/games/default/textures/stone.png"));
addResourceList(`./games/default/textures/grass.png`, base64PIC("./app/games/default/textures/grass.png"));
addResourceList(`./games/default/textures/dirt.png`, base64PIC("./app/games/default/textures/dirt.png"));
addResourceList(`./games/default/textures/infiniBlock.png`, base64PIC("./app/games/default/textures/infiniBlock.png"));
addResourceList(`./games/default/textures/oakPLANKS.png`, base64PIC("./app/games/default/textures/oakPLANKS.png"));
addResourceList(`./games/default/textures/oakLOG.png`, base64PIC("./app/games/default/textures/oakLOG.png"));
if(bywSERVER.WORLDSETTINGS.autoSaveInterval) allCommands["autoSaveON"].func(bywSERVER.WORLDSETTINGS.autoSaveInterval);