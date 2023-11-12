var languageSupport = {
    "en-US":{
        "serveradressINPUT@server":"Please input WebSocket-Server URL:",
        "userINPUT@server":"Please input username:",
        "passwordINPUT@server":"Please input password:",
        "timeout@server":"Server is in timeout!",
        "notmakeable@inventory":" is not makeable!",
        "needItemsPerItem@inventory":" needs next items to create",
        "howmanymake@inventory":"How many do you want to make?",
        "notenoughitems@inventory":"Not enoguh items!",
        "oldpassword@passwordchange":"Please input old password:",
        "newpassword@passwordchange":"Please input new password:",
        "makeItem@webelementslangsupport":"Make item",
        "changePassword@webelementslangsupport":"Change Password",
        "savename@server":"Save Username?",
        "notfromlogin@server":"Please login from login Website!"
    },
    "de-DE":{
        "serveradressINPUT@server":"Bitte WebSocket-Server URL eingeben:",
        "userINPUT@server":"Bitte Nutzername eingeben:",
        "passwordINPUT@server":"Bitte Passwort eingeben:",
        "timeout@server":"Server is in timeout!",
        "notmakeable@inventory":" ist nicht herstellbar!",
        "needItemsPerItem@inventory":" braucht folgende Items zum herstellen",
        "howmanymake@invenotry":"Wie viele willst du herstellen?",
        "notenoughitems@inventory":"Nicht genug Items!",
        "oldpassword@passwordchange":"Bitte altes Passwort eingeben:",
        "newpassword@passwordchange":"Bitte neues Passwort eingeben:",
        "makeItem@webelementslangsupport":"Herstellen",
        "changePassword@webelementslangsupport":"Passwort aendern",
        "savename@server":"Username speichern?",
        "notfromlogin@server":"Bitte von Login Website anmelden!"
    }
}
function translate(id){
    if(!languageSupport[language]) return languageSupport["en-US"][id];
    return languageSupport[language][id];
}
const language = navigator.language;

function translateFROMOBJ(obj){
    if(!obj[language]) return obj["en-US"];
    return obj[language];
}