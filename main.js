"use strict";
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
var playerName;
var newSprites = [];
var thing_names = [
    "chair",
    "lamp",
    "mushroom",
    "outhouse",
    "pillar",
    "pond",
    "rock",
    "statue",
    "tree",
    "turtle",
];
function insertCanvas() {
    var s = [];
    s.push("<canvas id=\"myCanvas\" width=\"1000\" height=\"500\" style=\"border:1px solid #cccccc;\">");
    s.push("</canvas>");
    var content = document.getElementById('content');
    if (content) { // Check if content is not null
        content.innerHTML = s.join('');
    }
    else {
        console.error('Element with id "content" not found');
    }
    s.push('<br><big><big><b>Gold: <span id="gold">0</span>, Bananas: <span id="bananas">0</span></b></big></big><br>');
    s.push('<br><select id="chatWindow" size="8" style="width:1000px"></select> <br> <input type="input" id="chatMessage"></input> <button onclick="postChatMessage()">Post</button>');
    content.innerHTML = s.join('');
}
function insertIntro() {
    var _a;
    var s = [];
    s.push("<h1>Banana Quest: The Potassium Crisis</h1>");
    s.push("<p>In a land known as \"Fruitopia,\" the inhabitants thrived on the delicious and nutritious fruits that grew abundantly. \n\tOne fruit, in particular, was highly treasured - the mighty banana. \n\tFruitopia's inhabitants had always enjoyed the health benefits and energy provided by this potassium-rich treat, \n\twhich fueled their daily adventures and brought joy to their lives.\n\t\n\tBut one day, a mysterious phenomenon occurred: the banana crops across Fruitopia began to wither, \n\tand the supply of this essential fruit dwindled rapidly.\n\tAs the days passed, the once energetic and lively inhabitants of Fruitopia started to feel weak and fatigued. \n\tThe doctors and scientists of the land quickly identified the cause - a severe potassium deficiency was spreading among the residents, \n\tand it threatened to plunge Fruitopia into a state of perpetual lethargy.\n\tDesperate to restore the health and vitality of their beloved land, \n\tthe citizens of Fruitopia are turning to you to help them find 20 bananas.\n\tThe fate of Fruitopia hangs in the balance.\n\t\n\ttl;dr: Find 20 bananas to win.\n\t\n\tIf you are willing to undertake this noble quest, please enter your name:</p>");
    s.push("<form id=\"startForm\">");
    s.push("<label for=\"name\">Enter your name:</label><br>");
    s.push("<input type=\"text\" id=\"name\" name=\"name\"><br>");
    var nameInput = document.getElementById('name');
    playerName = (nameInput === null || nameInput === void 0 ? void 0 : nameInput.value) || 'Player';
    s.push("<button id=\"startButton\">Start your adventure</button>");
    var content = document.getElementById('content');
    if (content) {
        content.innerHTML = s.join('');
    }
    else {
        console.error('Element with id "content" not found');
    }
    (_a = document.getElementById('startButton')) === null || _a === void 0 ? void 0 : _a.addEventListener('click', startGame);
}
insertIntro();
function postChatMessage(event) {
    var chat = document.getElementById('chatMessage');
    var message = chat.value;
    var payload = {
        action: 'chat',
        id: g_id,
        text: message,
    };
    httpPost('ajax.html', payload, function (ob) { return onAcknowledgeChat(ob); });
}
function onAcknowledgeChat(ob) {
    if (ob.status === "error") {
        console.error("Error: ".concat(ob.message));
        return;
    }
    if (ob.status === "chat_received") {
        console.log("Chat received: ".concat(JSON.stringify(ob)));
        return;
    }
}
function sendChat(id) {
    var message = document.getElementById('chatMessage');
    var payload = {
        action: 'chat',
        id: id,
        text: message.value,
    };
    httpPost('ajax.html', payload, function (ob) { return onAcknowledgeChat(ob); });
}
function on_receive_updates(ob) {
    if (!ob || !ob.updates) {
        console.error('Invalid updates object received', ob);
        return;
    }
    if (ob.status === 'error') {
        console.error("Error: ".concat(ob.message));
        return;
    }
    // Pull updates out of updates object
    if (ob.updates.length > 0) {
        for (var i = 0; i < ob.updates.length; i++) {
            //extract objects from updates
            var update = ob.updates[i];
            var update_id = update["id"];
            var update_name = update["name"];
            var update_x = update["x"];
            var update_y = update["y"];
            // if the incoming id is my id, continue
            if (update_id == g_id) {
                continue;
            }
            //find the sprite with id update-id
            var found = false;
            for (var _i = 0, newSprites_1 = newSprites; _i < newSprites_1.length; _i++) {
                var sprite = newSprites_1[_i];
                if ((sprite.id === update_id)) {
                    sprite.dest_x = update_x;
                    sprite.dest_y = update_y;
                    found = true;
                    break;
                }
            }
            //if no matching sprites, make a new one and make it so
            // that it can move but it can't be moved by my mouse
            // also make it green
            if (!found) {
                var newSprite = new Sprite(update_name, update_x, update_y, update_id, "green_robot.png", Sprite.prototype.go_toward_destination, Sprite.prototype.ignore_click);
                newSprites.push(newSprite);
            }
        }
    }
    // Pull chats out of updates object
    var processChats = ob.chats;
    // If there are chats to process, process them 
    if (processChats.length > 0) {
        processChats.forEach(function (chat) {
            var option = document.createElement("option"); // create an option element for each chat
            option.value = chat; // set options value and innerHTML to the chat
            option.innerHTML = chat;
            document.getElementById("chatWindow").appendChild(option); // append to chat window
            option.scrollIntoView(); // scroll new chats into view
        });
    }
    ;
    // Pull gold and bananas out of updates object
    var gold = ob.gold;
    var bananas = ob.bananas;
    // Update gold and bananas
    document.getElementById("gold").innerHTML = gold;
    document.getElementById("bananas").innerHTML = bananas;
}
function requestUpdates() {
    var payload = {
        action: "update",
        id: g_id,
    };
    httpPost('ajax.html', payload, function (ob) { return on_receive_updates(ob); });
}
//=============================================================
//                       CLASS BREAK
//=============================================================
var Features = /** @class */ (function () {
    function Features(kind, x, y) {
        this.kind = kind;
        this.x = x;
        this.y = y;
        this.image = new Image();
        this.image.src = "".concat(thing_names[kind], ".png");
    }
    Features.prototype.update = function () { };
    return Features;
}());
//=============================================================
//					   CLASS BREAK
//=============================================================
var Sprite = /** @class */ (function () {
    function Sprite(name, x, y, id, image_url, update_method, onclick_method) {
        this.name = name;
        this.x = x;
        this.y = y;
        this.id = id;
        this.speed = 4;
        this.image = new Image();
        this.image.src = image_url;
        this.update = update_method;
        this.onclick = onclick_method;
    }
    Sprite.prototype.set_destination = function (x, y) {
        this.dest_x = x;
        this.dest_y = y;
    };
    Sprite.prototype.ignore_click = function (x, y) { };
    Sprite.prototype.move = function (dx, dy) {
        this.dest_x = this.x + dx;
        this.dest_y = this.y + dy;
    };
    Sprite.prototype.go_toward_destination = function () {
        if (this.dest_x === undefined || this.dest_y === undefined)
            return;
        if (this.x < this.dest_x)
            this.x += Math.min(this.dest_x - this.x, this.speed);
        else if (this.x > this.dest_x)
            this.x -= Math.min(this.x - this.dest_x, this.speed);
        if (this.y < this.dest_y)
            this.y += Math.min(this.dest_y - this.y, this.speed);
        else if (this.y > this.dest_y)
            this.y -= Math.min(this.y - this.dest_y, this.speed);
    };
    Sprite.prototype.sit_still = function () { };
    return Sprite;
}());
var center_x = 500;
var center_y = 270;
var scroll_rate = 0.05;
//=============================================================
//                       CLASS BREAK
//=============================================================
var Model = /** @class */ (function () {
    function Model() {
        this.features = [];
        this.turtle = new Sprite(playerName, 50, 50, g_id, "blue_robot.png", Sprite.prototype.go_toward_destination, Sprite.prototype.set_destination);
        newSprites.push(this.turtle);
        this.features = [];
    }
    Model.prototype.addFeature = function (kind, x, y) {
        var image = new Image();
        image.src = "".concat(thing_names[kind], ".png");
        var newFeature = new Features(kind, x, y);
        this.features.push(newFeature);
    };
    Model.prototype.update = function () {
        for (var _i = 0, newSprites_2 = newSprites; _i < newSprites_2.length; _i++) {
            var sprite = newSprites_2[_i];
            sprite.update();
        }
    };
    Model.prototype.onclick = function (x, y) {
        this.turtle.onclick(x, y);
    };
    Model.prototype.move = function (dx, dy) {
        this.turtle.move(dx, dy);
    };
    return Model;
}());
//=============================================================
//                       CLASS BREAK
//=============================================================
var View = /** @class */ (function () {
    function View(model) {
        this.featureImages = [];
        this.global_scroll_x = 0;
        this.global_scroll_y = 0;
        this.model = model;
        this.canvas = document.getElementById("myCanvas");
        this.turtle = new Image();
        this.turtle.src = "blue_robot.png";
        this.featureImages = [];
        for (var i = 0; i < thing_names.length; i++) {
            var image = new Image();
            image.src = "".concat(thing_names[i], ".png");
            this.featureImages.push(image);
        }
        this.get_map();
    }
    View.prototype.update = function () {
        var ctx = this.canvas.getContext("2d");
        this.global_scroll_x += scroll_rate * (this.model.turtle.x - this.global_scroll_x - center_x);
        this.global_scroll_y += scroll_rate * (this.model.turtle.y - this.global_scroll_y - center_y);
        if (ctx) {
            ctx.clearRect(0, 0, 1000, 500);
            for (var _i = 0, newSprites_3 = newSprites; _i < newSprites_3.length; _i++) {
                var sprite = newSprites_3[_i];
                ctx.drawImage(sprite.image, ((sprite.x - sprite.image.width / 2) - this.global_scroll_x), ((sprite.y - sprite.image.height) - this.global_scroll_y));
                ctx.font = "20px Monocraft";
                ctx.fillText(sprite.name, ((sprite.x - sprite.image.width / 2) - this.global_scroll_x), ((sprite.y - sprite.image.height - 10) - this.global_scroll_y));
            }
            for (var _a = 0, _b = this.model.features; _a < _b.length; _a++) {
                var feature = _b[_a];
                ctx.drawImage(feature.image, ((feature.x - feature.image.width / 2) - this.global_scroll_x), ((feature.y - feature.image.height) - this.global_scroll_y));
            }
        }
    };
    View.prototype.get_map = function () {
        var _this = this;
        var payload = {
            action: "get_map",
        };
        httpPost('ajax.html', payload, function (ob) { return _this.mapReceived(ob); });
    };
    View.prototype.mapReceived = function (ob) {
        if (ob.status === 'error') {
            console.error("Error: ".concat(ob.message));
            return;
        }
        if (ob.status === 'map') {
            for (var i = 1; i < ob.map.things.length; i++) {
                var object = ob.map.things[i];
                var objectKind = object.kind;
                var objectX = object.x;
                var objectY = object.y;
                this.model.addFeature(objectKind, objectX, objectY);
            }
        }
    };
    return View;
}());
//=============================================================
//                       CLASS BREAK
//=============================================================
var Controller = /** @class */ (function () {
    function Controller(model, view) {
        this.key_right = false;
        this.key_left = false;
        this.key_up = false;
        this.key_down = false;
        this.lastUpdatesRequestTime = 0;
        this.updateInterval = 1000; // 1 second interval
        this.model = model;
        this.view = view;
        this.key_right = false;
        this.key_left = false;
        this.key_up = false;
        this.key_down = false;
        var self = this;
        view.canvas.addEventListener("click", function (event) { self.onClick(event); });
        document.addEventListener('keydown', function (event) { self.keyDown(event); }, false);
        document.addEventListener('keyup', function (event) { self.keyUp(event); }, false);
    }
    Controller.prototype.onClick = function (event) {
        var x = event.pageX - this.view.canvas.offsetLeft + this.view.global_scroll_x;
        var y = event.pageY - this.view.canvas.offsetTop + this.view.global_scroll_y;
        this.model.onclick(x, y);
        // Send move request to server
        httpPost('ajax.html', {
            action: 'move',
            id: g_id,
            name: playerName,
            x: x,
            y: y,
        }, this.onAcknowledgeClick);
    };
    Controller.prototype.onAcknowledgeClick = function (ob) {
        if (ob.status === 'error') {
            console.error("Error: ".concat(ob.message));
            return;
        }
        if (ob.status === 'moved') {
            console.log("Move received: ".concat(JSON.stringify(ob)));
            return;
        }
    };
    Controller.prototype.keyDown = function (event) {
        if (event.keyCode == 39)
            this.key_right = true;
        else if (event.keyCode == 37)
            this.key_left = true;
        else if (event.keyCode == 38)
            this.key_up = true;
        else if (event.keyCode == 40)
            this.key_down = true;
    };
    Controller.prototype.keyUp = function (event) {
        if (event.keyCode == 39)
            this.key_right = false;
        else if (event.keyCode == 37)
            this.key_left = false;
        else if (event.keyCode == 38)
            this.key_up = false;
        else if (event.keyCode == 40)
            this.key_down = false;
    };
    Controller.prototype.update = function () {
        var dx = 0;
        var dy = 0;
        var speed = this.model.turtle.speed;
        if (this.key_right)
            dx += speed;
        if (this.key_left)
            dx -= speed;
        if (this.key_up)
            dy -= speed;
        if (this.key_down)
            dy += speed;
        if (dx != 0 || dy != 0)
            this.model.move(dx, dy);
        // Is it time to request updates
        var currentTime = Date.now();
        if (currentTime - this.lastUpdatesRequestTime >= this.updateInterval) {
            this.lastUpdatesRequestTime = currentTime;
            requestUpdates();
        }
    };
    return Controller;
}());
//=============================================================
//                       CLASS BREAK
//=============================================================
var Game = /** @class */ (function () {
    function Game() {
        this.model = new Model();
        this.view = new View(this.model);
        this.controller = new Controller(this.model, this.view);
    }
    Game.prototype.onTimer = function () {
        this.controller.update();
        this.model.update();
        this.view.update();
    };
    return Game;
}());
function startGame() {
    playerName = document.getElementById('name').value;
    console.log('user entered name: ' + playerName);
    if (!playerName) {
        console.error('Player name is null or empty');
        return;
    }
    insertCanvas();
    console.log("Starting game for ".concat(playerName, "..."));
    var game = new Game();
    var timer = setInterval(function () { game.onTimer(); }, 40);
}
var random_id = function (len) {
    var p = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    return __spreadArray([], Array(len), true).reduce(function (a) { return a + p[Math.floor(Math.random() * p.length)]; }, '');
};
var g_origin = new URL(window.location.href).origin;
//const g_origin = 'http://jacquard.ddns.uark.edu:8080';
var g_id = random_id(12);
// Payload is a marshaled (but not JSON-stringified) object
// A JSON-parsed response object will be passed to the callback
var httpPost = function (page_name, payload, callback) {
    var request = new XMLHttpRequest();
    request.onreadystatechange = function () {
        if (request.readyState === 4) {
            if (request.status === 200) {
                var response_obj = void 0;
                try {
                    response_obj = JSON.parse(request.responseText);
                }
                catch (err) { }
                if (response_obj) {
                    callback(response_obj);
                }
                else {
                    callback({
                        status: 'error',
                        message: 'response is not valid JSON',
                        response: request.responseText,
                    });
                }
            }
            else {
                if (request.status === 0 && request.statusText.length === 0) {
                    callback({
                        status: 'error',
                        message: 'connection failed',
                    });
                }
                else {
                    callback({
                        status: 'error',
                        message: "server returned status ".concat(request.status, ": ").concat(request.statusText),
                    });
                }
            }
        }
    };
    request.open('post', "".concat(g_origin, "/").concat(page_name), true);
    request.setRequestHeader('Content-Type', 'application/json');
    request.send(JSON.stringify(payload));
};
