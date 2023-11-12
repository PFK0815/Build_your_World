function getRandomInt(min, max){return Math.floor(Math.random()*(max-min)+min)}
var allItems = {};
function setBlock(elem){
	var [,y,x] = elem.id.split("y").toString().split("x").toString().split(",");
	client.send(JSON.stringify({type:"SetBlock", coord:[y,x], item:item.value}));
}
function breakBlock(elem){
	var [,y,x] = elem.id.split("y").toString().split("x").toString().split(",");
	client.send(JSON.stringify({type:"BreakBlock", coord:[y,x]}));
}
var player = {
	inventory: {}
}
function updateInventory(){
	item.innerHTML = "";
	Object.entries(JSON.parse(JSON.stringify(allItems))).forEach(element => {
		if(element[1].notInInventory) return;
		item.innerHTML += `<option value="${element[0]}" itemID="${element[0]}" class="itemSelect">${translateFROMOBJ(element[1].itemname)} ${player.inventory[element[0]] || 0}</option>`;
	});
}

function makeItem(){
	var recipe = allItems[item.value].makeItemsNeeded;
	if(!recipe){alert(`${translateFROMOBJ(allItems[item.value].itemname)}${translate("notmakeable@inventory")}`); return}
	var string = `${translateFROMOBJ(allItems[item.value].itemname)}${translate("needItemsPerItem@inventory")}:\n`;
	recipe.forEach(element => {
		element = element.split(" ");
		string += `${translateFROMOBJ(allItems[element[0]].itemname)} ${element[1]}/${player.inventory[element[0]] || 0}\n`;
	});
	if(!confirm(string)) return;
	var makeable = true;
	var many = prompt(translate("howmanymake@inventory"))
	many = +many;
	recipe.forEach(element => {
		element = element.split(" ");
		if(player.inventory[element[0]] < element[1]*many){
			alert(translate("notenoughitems@inventory"));
			makeable = false;
			return;
		}
	});
	if(!makeable) return;
	client.send(JSON.stringify({type:"CraftItem", item:item.value, many}))
};

function chatMSGSEND(text){
	var thenscroll = false;
	if(chat.scrollTop+300 >= chat.scrollHeight-10) thenscroll = true;
	chat.innerHTML += text+"<br />";
	if(thenscroll) chat.scroll({ top: chat.scrollHeight, behavior: 'smooth' });
}

var speed = 50;
document.addEventListener("keypress", (e)=>{
	if(e.key == "w"){
		map.scrollTop -= speed;
         updateScroll()
	}else if(e.key == "a"){
		map.scrollLeft -= speed;
         updateScroll()
	}else if(e.key == "s"){
		map.scrollTop += speed;
         updateScroll()
	}else if(e.key == "d"){
		map.scrollLeft += speed;
         updateScroll()
	}
});

function requestChangePwd(){
	var oldServerhash = (`USER"${user}"WITHPWDHASHmd5("${prompt(translate("oldpassword@passwordchange")).md5()}")`).md5();
	serverhash = (`USER"${user}"WITHPWDHASHmd5("${prompt(translate("newpassword@passwordchange")).md5()}")`).md5();
	client.send(JSON.stringify({type:"ChangePwd", oldHash:oldServerhash, newHash:serverhash}));
}

document.addEventListener("DOMContentLoaded", ()=>{
	makeItemLANGSUPPORT.innerHTML = translate("makeItem@webelementslangsupport");
	changePWDLANGSUPPORT.innerHTML = translate("changePassword@webelementslangsupport");
});

var lastMaxUpdate = 0;
function updateScroll(){
    if(map.scrollTop/50 >= lastMaxUpdate){
        client.send(JSON.stringify({type:"GiveMeMap"}));
        lastMaxUpdate ++;
    }
}