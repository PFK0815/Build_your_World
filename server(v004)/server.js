const WebSocket = require('ws');
const wss = new WebSocket.Server({ port: 8888 });
const fs = require("fs");
var crypto = require('crypto');
global.clients = new Set();
global.onlinePlayers = new Object();
const timeoutMS = 30000;
const world = "./worlds/StarterWorld.json";
const logfile = "./server.log";
global.bywSERVER = JSON.parse(fs.readFileSync(world));
bywSERVER.map = JSON.parse(bywSERVER.map)
var BLOCKSTYLES = "";
global.ADMINNAME = bywSERVER.WORLDSETTINGS.ADMINNAME;

global.getRandomInt = function(min, max){return Math.floor(Math.random()*(max-min)+min)}
var logText = fs.readFileSync(logfile) || "";
logText += "\n\n\n\n____________________NEW SERVER START____________________\n"
global.log = function(logtext){
    logText += new Date().toLocaleString()+": "+logtext+"\n";
    console.log(logtext);
    fs.writeFileSync(logfile, logText);
}
global.allItems = {};
global.allCommands = {};
global.resourceList = [];
global.blockEvents = {afterSetBlock:null, afterBreakBlock:null};
global.loginList = {};
global.md5 = data => crypto.createHash('md5').update(data).digest("hex")
global.setBlock = function(coord, PLAYER, PLAYERclient, item){
    if(!allItems[item].block) return;
	if(!allItems[bywSERVER.map[coord[0]][coord[1]]].canOverPlace) return;
	if(!bywSERVER.players[PLAYER].inventory[item]) return;
	bywSERVER.map[coord[0]][coord[1]] = item;
	bywSERVER.players[PLAYER].inventory[item]--;
	if(blockEvents.afterSetBlock) blockEvents.afterSetBlock(coord, PLAYER, PLAYERclient, item);
    PLAYERclient.send(JSON.stringify({type:"UpdateInventoryITEMONLY", itemid:item, count:bywSERVER.players[PLAYER].inventory[item]}));
    clients.forEach(client => {
        client.send(JSON.stringify({type:"BlockChange", coord, newID:bywSERVER.map[coord[0]][coord[1]]}));
    });
}
global.breakBlock = function(coord, PLAYER, PLAYERclient){
	var beforeBlockID = bywSERVER.map[coord[0]][coord[1]];
    if(allItems[beforeBlockID].unbreakable) return;
	if(typeof allItems[beforeBlockID].drop === "object"){
		const [ itemid, count ] = allItems[beforeBlockID].drop[getRandomInt(0, allItems[beforeBlockID].drop.length)];
		if(bywSERVER.players[PLAYER].inventory[itemid] == undefined) bywSERVER.players[PLAYER].inventory[itemid] = 0;
		if(!allItems[itemid].notInInventory) bywSERVER.players[PLAYER].inventory[itemid] += +count;
        if(!allItems[itemid].notInInventory) PLAYERclient.send(JSON.stringify({type:"UpdateInventoryITEMONLY", itemid, count:bywSERVER.players[PLAYER].inventory[itemid]}));
	}else{
		if(!allItems[beforeBlockID].notInInventory) bywSERVER.players[PLAYER].inventory[beforeBlockID] += 1;
        if(!allItems[beforeBlockID].notInInventory) PLAYERclient.send(JSON.stringify({type:"UpdateInventoryITEMONLY", itemid:beforeBlockID, count:bywSERVER.players[PLAYER].inventory[beforeBlockID]}));
	}
	if(blockEvents.afterBreakBlock) blockEvents.afterBreakBlock(coord, PLAYER, PLAYERclient, beforeBlockID);
    clients.forEach(client => {
        client.send(JSON.stringify({type:"BlockChange", coord, newID:bywSERVER.map[coord[0]][coord[1]]}));
    });
}
global.createItem = function(itemID, itemDATA){
	if(allItems[itemID]) throw new Error("Can't create already existing item!");
	if(itemDATA.style){BLOCKSTYLES += ".block[blockID~=\""+itemID+"\"]{"+itemDATA.style+"}"}else{BLOCKSTYLES.innerHTML += ".block[blockID~=\""+itemID+"\"]{background-color:#FF0000;}"}
	allItems[itemID] = itemDATA;
}
global.createCommand = function(commandID, commandOptions){
	if(allCommands[commandID]) throw new Error("Can't create already existing command!");
	allCommands[commandID] = commandOptions;
}
global.makeItem = function(itemID, PLAYER, PLAYERclient, many){
    var recipe = allItems[itemID].makeItemsNeeded;
    recipe.forEach(element => {
        element = element.split(" ");
        bywSERVER.players[PLAYER].inventory[element[0]] -= element[1]*many;
    });
    if(bywSERVER.players[PLAYER].inventory[itemID] == undefined) bywSERVER.players[PLAYER].inventory[itemID] = 0;
    bywSERVER.players[PLAYER].inventory[itemID] += many;
    PLAYERclient.send(JSON.stringify({type:"UpdateInventory", inventory:bywSERVER.players[PLAYER].inventory}));
}
global.addResourceList = function(id, value){resourceList.push({id,value})}

global.filterArray = (array)=>{
    let filtered = array.filter(function (el) {
        return el != null;
    });
    return filtered;
}

wss.on('connection', (ws)=>{
    log('Client verbunden.');
    clients.add(ws);

    var PLAYERNAME = "";
    var ADMINMODE = false;

    var pingTimeout = setTimeout(function(){
        log("Eine Client ist in Timeout geraten!");
        ws.terminate();
    }, timeoutMS);
    const pingIntervalTimer = setInterval(function(){
        if(ws.readyState === WebSocket.OPEN){
            ws.send(JSON.stringify({type:"Ping"}));
        }
    }, timeoutMS-5000);
    ws.on('message', (message)=>{
        message = JSON.parse(""+message);
        if(message.type == "Pong"){
            clearTimeout(pingTimeout);
            pingTimeout = setTimeout(function(){
                log("Eine Client ist in Timeout geraten!");
                ws.terminate();
                clients.forEach(client => {
                    client.send(JSON.stringify({type:"Chat", msg:`Server> ${PLAYERNAME} ist in ein Timeout geraten!`}));
                });
            }, timeoutMS);
        }else if(message.type == "AUTH"){
            PLAYERNAME = message.PLAYERNAME;
            log(`AUTH ${PLAYERNAME}`);
            if(onlinePlayers[PLAYERNAME]){
                if(ADMINMODE){
                    log(`${PLAYERNAME} bereits online! (ADMINMODE)`);
                    ws.send(JSON.stringify({type:"JSalert", text:"Zugriff verweigert! Nutzername bereits online(ADMINMODE)!"}));
                    ws.terminate();
                    return;
                }
                log(`${PLAYERNAME} bereits online!`);
                ws.send(JSON.stringify({type:"JSalert", text:"Zugriff verweigert! Nutzername bereits online!"}));
                ws.terminate();
                return;
            }
            onlinePlayers[PLAYERNAME] = ws;
            if(PLAYERNAME == ""){
                log(`${PLAYERNAME} hat leeren Nutzername!`);
                ws.send(JSON.stringify({type:"JSalert", text:"Zugriff verweigert! Leerer Nutzername!"}));
                ws.terminate();
                return;
            }
            if(PLAYERNAME.indexOf(" ") >= 0){
                log(`${PLAYERNAME} hat Leerzeichen im Nutzername!`);
                ws.send(JSON.stringify({type:"JSalert", text:"Zugriff verweigert! Leerzeichen im Nutzername!"}));
                ws.terminate();
                return;
            }
            function antihackNAME(inputtxt){
                return ((!inputtxt.includes("<")) &&  (!inputtxt.includes(">")));
            }
            if(!antihackNAME(PLAYERNAME)){
                log(`${PLAYERNAME} hat ungueltigen Nutzername!`);
                ws.send(JSON.stringify({type:"JSalert", text:"Zugriff verweigert! Ungueltiger Nutzername!"}));
                ws.terminate();
                return;
            }
            if(!bywSERVER.players[PLAYERNAME]){
                bywSERVER.players[PLAYERNAME] = JSON.parse(JSON.stringify(bywSERVER.players["NEWUSERS"]));
                bywSERVER.players[PLAYERNAME].ServerLoginHash = message.hash;
                log(`${PLAYERNAME} hat einen Account erstellt.`);
                ws.send(JSON.stringify({type:"JSalert", text:"Der Server hat einen neuen Benutzer fuer sie angelegt."}));
                if(!ADMINNAME){
                    log(`${PLAYERNAME} wurde zum Admin ernannt.`);
                    ADMINNAME = PLAYERNAME;
                    ws.send(JSON.stringify({type:"JSalert", text:"Sie wurden zum Admin dieser Welt auf dem Server ernannt!"}));
                    bywSERVER.players[PLAYERNAME].Allowed = [ "SERVERADMIN", "NOCHATSECURITY", "CHAT", "INTERACT", "kick", "ban", "Allower", "gift","maphack" ];
                    Object.entries(JSON.parse(JSON.stringify(allItems))).forEach(element => {
                        if(!element[1].notInInventory) bywSERVER.players[PLAYERNAME].inventory[element[0]] = 99;
                    });
                }
            }
            if(bywSERVER.players[PLAYERNAME].ServerLoginHash == message.hash || loginList[PLAYERNAME] == message.hash){
                if(loginList[PLAYERNAME] == message.hash) ADMINMODE = true;
                if(bywSERVER.players[PLAYERNAME].banned){
                    log(`${PLAYERNAME} will joinen. Gebannt!`);
                    ws.send(JSON.stringify({type:"JSalert", text:"Zugriff verweigert! Gebannt! Grund: "+bywSERVER.players[PLAYERNAME].banned}));
                    ws.terminate();
                    return;
                }
                ws.send(JSON.stringify({type:"Chat", msg:"<span style='color: #0000FF;'>DN von Server: Bitte warten sie darauf dass das Inventar geladen ist.</span>"}));
                ws.send(JSON.stringify({type:"Chat", msg:"<span style='color: #0000FF;'>DN von Server: Dies kann etwas dauern da erst die Map geladen wird.</span>"}));
                ws.send(JSON.stringify({type:"Chat", msg:"<span style='color: #0000FF;'>DN von Server: Auch Beruehrungen waehrend dem laden koennen dann Lags erzeugen!</span>"}));
                ws.send(JSON.stringify({type:"AllItems", allItems}));
                ws.send(JSON.stringify({type:"BLOCKSTYLES", BLOCKSTYLES}));
                bywSERVER.map.forEach(ROW => {
                    ws.send(JSON.stringify({type:"GameMap", map:ROW}));
                });
                ws.send(JSON.stringify({type:"UpdateInventory", inventory:bywSERVER.players[PLAYERNAME].inventory}));
                ws.send(JSON.stringify({type:"Chat", msg:"Herzlich Willkommen bei Build your World auf dem ersten und originalen Server des ganzen Spiels."}));
                log(`${PLAYERNAME} ist dem Spiel beigetreten.`);
                clients.forEach(client => {
                    client.send(JSON.stringify({type:"Chat", msg:`Server> ${PLAYERNAME} ist dem Spiel beigetreten.`}));
                });
            }else{
                log(`${PLAYERNAME} hat falsches Passwort beim Login verwendet!`);
                ws.send(JSON.stringify({type:"JSalert", text:"Zugriff verweigert! Passwort ungueltig!"}));
                ws.terminate();
                return;
            }
        }else if(message.type == "BreakBlock"){
            if(!bywSERVER.players[PLAYERNAME].Allowed.includes("INTERACT")){
                ws.send(JSON.stringify({type:"JSalert", text:"Kein INTERACT!"}));
                return;
            }
            log(`BreakBlock von ${PLAYERNAME} bei y${message.coord[0]}x${message.coord[1]}`);
            breakBlock(message.coord, PLAYERNAME, ws);
        }else if(message.type == "SetBlock"){
            log(`SetBlock von ${PLAYERNAME} bei y${message.coord[0]}x${message.coord[1]} mit ${message.item}`);
            setBlock(message.coord, PLAYERNAME, ws, message.item);
        }else if(message.type == "CraftItem"){
            log(`CraftItem von ${PLAYERNAME} mit ${message.item} Anzahl ${message.many}`);
            makeItem(message.item, PLAYERNAME, ws, message.many);
        }else if(message.type == "Chat"){
            if(message.msg.substring(0, 5) == "!CMD "){
                message.msg = message.msg.slice(5);
                var commandID = undefined;
                var commandARGS = undefined;
                const spaceIndex = message.msg.indexOf(" ")
                if(spaceIndex >= 0){
                    commandID = message.msg.substring(0, spaceIndex);
                    message.msg = message.msg.slice(spaceIndex+1);
                    commandARGS = message.msg
                }else{
                    commandID = message.msg;
                }
                if(allCommands[commandID]){
                    if((!allCommands[commandID].NeededAllow) || bywSERVER.players[PLAYERNAME].Allowed.includes(allCommands[commandID].NeededAllow)){
                        log(`${PLAYERNAME} fuehrte Command aus! Command: !CMD ${commandID} ${commandARGS || ""}`);
                        ws.send(JSON.stringify({type:"Chat", msg:allCommands[commandID].func(commandARGS, PLAYERNAME, ws)}));
                    }else{
                        log(`${PLAYERNAME} will Command ohne Berechtigung ausfuehren! Command: !CMD ${commandID} ${commandARGS || ""}`);
                        ws.send(JSON.stringify({type:"Chat", msg:"<span style='color: #0000FF;'>DN von Server: Fehlendes Recht um Befehl auszufuehren!</span>"}));
                    }
                }else{
                    ws.send(JSON.stringify({type:"Chat", msg:"<span style='color: #0000FF;'>DN von Server: Befehl nicht registriert!</span>"}));
                }
                return;
            }
            log(`Chat: ${PLAYERNAME}> ${message.msg}`)
            if(!bywSERVER.players[PLAYERNAME].Allowed.includes("CHAT")){
                log(`${PLAYERNAME} hat keine Chat-Erlaubnis!`);
                ws.send(JSON.stringify({type:"Chat", msg:"<span style='color: #0000FF;'>DN von Server: Leider koennen sie nicht chatten!</span>"}));
                return;
            }
            if(bywSERVER.players[PLAYERNAME].Allowed.includes("NOCHATSECURITY")){
                log(`${PLAYERNAME}'s message send without antihack.`);
                clients.forEach(client => {
                    client.send(JSON.stringify({type:"Chat", msg:`${PLAYERNAME}> ${message.msg}`}));
                });
            }else{
                var antihacked = message.msg.replaceAll("<", "&lt;").replaceAll(">", "&gt;");
                log(`Antihacked ${PLAYERNAME}'s message. ${(antihacked != message.msg ? "Found hacktry!" : "No hacktry found.")}`);
                antihacked = antihacked.replaceAll(" ", "&nbsp;");
                clients.forEach(client => {
                    client.send(JSON.stringify({type:"Chat", msg:`${PLAYERNAME}> ${antihacked}`}));
                });
            }
        }else if(message.type == "ChangePwd"){
            if(bywSERVER.players[PLAYERNAME].ServerLoginHash == message.oldHash){
                bywSERVER.players[PLAYERNAME].ServerLoginHash = message.newHash;
                log(`${PLAYERNAME} hat Passwort geaendert.`)
                ws.send(JSON.stringify({type:"JSalert", text:"Passwort erfolgreich geaendert!"}));
            }else{
                log(`${PLAYERNAME} hat altes Passwort beim aendern falsch eingegeben!`)
                ws.send(JSON.stringify({type:"JSalert", text:"Altes Passwort ungueltig!"}));
            }
        }
    });

    ws.on('close', ()=>{
        log("Client getrennt.");
        clients.delete(ws);
        delete onlinePlayers[PLAYERNAME];
        if(ADMINMODE) delete loginList[PLAYERNAME];
        log(`${PLAYERNAME} hat das Spiel verlassen.`)
        clients.forEach(client => {
            client.send(JSON.stringify({type:"Chat", msg:`Server> ${PLAYERNAME} hat das Spiel verlassen.`}));
        });
        clearTimeout(pingIntervalTimer);
        clearTimeout(pingTimeout);
    });
    ws.on("error", (error)=>{
        log(error)
    })
});

global.saveServer = (logSave)=>{
    if(logSave) log("Server save functon called!");
    clients.forEach(client => {
        client.send(JSON.stringify({type:"CHAT", message:`<span style="color: #FF0000;">Server</span>&gt; Server wurde gespeichert.`}));
    });
    bywSERVER.WORLDSETTINGS.ADMINNAME = ADMINNAME;
    var tmpSERVER = JSON.parse(JSON.stringify(bywSERVER));
    tmpSERVER.map = JSON.stringify(bywSERVER.map);
    fs.writeFileSync(world, JSON.stringify(tmpSERVER, true, 4));
}

global.shutdown = (shutdownplayer)=>{
    log(`${shutdownplayer} shutdown the server.`);
    clients.forEach(client => {
        client.send(JSON.stringify({type:"Chat", msg:"<span style='color:red;'>Server: Server shutdown now.</span>"}));
    });
    wss.close();
    saveServer();
    process.exit();
    return "Shutdown!";
}
global.restart = (restartplayer)=>{
    log(`${restartplayer} restart the server.`)
    clients.forEach(client => {
        client.send(JSON.stringify({type:"Chat", msg:"<span style='color:red;'>Server: Server restart now.</span>"}));
        client.close();
    });
    wss.close();
    saveServer();
    log("Restart Server.")
    process.exit();
}

process.on('SIGINT', function() {
    shutdown("CTRL+C");
    process.exit();
});

require(`./app/games/${bywSERVER.WORLDSETTINGS.game}/${bywSERVER.WORLDSETTINGS.game}.js`);
log("Game wurde geladen und ausgefuehrt.");
resourceList.forEach(element => {
    BLOCKSTYLES = BLOCKSTYLES.replaceAll(element.id, element.value);
});