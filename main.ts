let playerName: string;
let newSprites: Sprite[] = [];

const thing_names = [
	"chair", // 0
	"lamp",
	"mushroom", // 2
	"outhouse",
	"pillar", // 4
	"pond",
	"rock", // 6
	"statue",
	"tree", // 8
	"turtle",
];

function insertCanvas() {
    let s: string[] = [];
    s.push(`<canvas id="myCanvas" width="1000" height="500" style="border:1px solid #cccccc;">`);
    s.push(`</canvas>`);
    const content = document.getElementById('content') as HTMLElement;
    
	if (content) { // Check if content is not null
        content.innerHTML = s.join('');
    } else {
        console.error('Element with id "content" not found');
    }
	
	s.push('<br><big><big><b>Gold: <span id="gold">0</span>, Bananas: <span id="bananas">0</span></b></big></big><br>');
	s.push('<br><select id="chatWindow" size="8" style="width:1000px"></select> <br> <input type="input" id="chatMessage"></input> <button onclick="postChatMessage()">Post</button>');
    content.innerHTML = s.join('');
}

function insertIntro() {
    let s: string[] = [];
    s.push(`<h1>Banana Quest: The Potassium Crisis</h1>`);
    s.push(`<p>In a land known as "Fruitopia," the inhabitants thrived on the delicious and nutritious fruits that grew abundantly. 
	One fruit, in particular, was highly treasured - the mighty banana. 
	Fruitopia's inhabitants had always enjoyed the health benefits and energy provided by this potassium-rich treat, 
	which fueled their daily adventures and brought joy to their lives.
	
	But one day, a mysterious phenomenon occurred: the banana crops across Fruitopia began to wither, 
	and the supply of this essential fruit dwindled rapidly.
	As the days passed, the once energetic and lively inhabitants of Fruitopia started to feel weak and fatigued. 
	The doctors and scientists of the land quickly identified the cause - a severe potassium deficiency was spreading among the residents, 
	and it threatened to plunge Fruitopia into a state of perpetual lethargy.
	Desperate to restore the health and vitality of their beloved land, 
	the citizens of Fruitopia are turning to you to help them find 20 bananas.
	The fate of Fruitopia hangs in the balance.
	
	tl;dr: Find 20 bananas to win.
	
	If you are willing to undertake this noble quest, please enter your name:</p>`);
    s.push(`<form id="startForm">`);
    s.push(`<label for="name">Enter your name:</label><br>`);
    s.push(`<input type="text" id="name" name="name"><br>`);
    let nameInput = document.getElementById('name');
	playerName = (nameInput as HTMLInputElement)?.value || 'Player';

	s.push(`<button id="startButton">Start your adventure</button>`);
    const content = document.getElementById('content');
    if (content) {
        content.innerHTML = s.join('');
    } else {
        console.error('Element with id "content" not found');
    }

	document.getElementById('startButton')?.addEventListener('click', startGame);
}

insertIntro();

function postChatMessage(event: MouseEvent) {
	let chat = document.getElementById('chatMessage') as HTMLInputElement;
	let message = chat.value;

	let payload = {
		action: 'chat',
		id: g_id,
		text: message,
	};
	httpPost('ajax.html', payload, (ob) => onAcknowledgeChat(ob));
}

function onAcknowledgeChat(ob: any) {
	if (ob.status === "error") {
		console.error(`Error: ${ob.message}`);
		return;
	}

	if (ob.status === "chat_received") {
		console.log(`Chat received: ${JSON.stringify(ob)}`);
		return;
	}
}

function sendChat(id: string) {
	let message = document.getElementById('chatMessage') as HTMLInputElement;

	let payload = {
		action: 'chat',
		id: id,
		text: message.value,
	};
	httpPost('ajax.html', payload, (ob) => onAcknowledgeChat(ob));
}

function on_receive_updates(ob: any) {
	if (!ob || !ob.updates) {
		console.error('Invalid updates object received', ob);
		return;
	}

	if (ob.status === 'error') {
		console.error(`Error: ${ob.message}`);
		return;
	}

	// Pull updates out of updates object
	if(ob.updates.length > 0) {
		for (let i = 0; i < ob.updates.length; i++) {
			//extract objects from updates
			let update = ob.updates[i];
			let update_id = update["id"];
			let update_name = update["name"];
			let update_x = update["x"];
			let update_y = update["y"];
			// if the incoming id is my id, continue
			if (update_id == g_id) {
				continue
			}

			//find the sprite with id update-id
			let found = false;
			for (let sprite of newSprites) {
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
				let newSprite = new Sprite(update_name, update_x, update_y, update_id, "green_robot.png", Sprite.prototype.go_toward_destination, Sprite.prototype.ignore_click);
				newSprites.push(newSprite);

			}
		}
	}
	
	// Pull chats out of updates object
	let processChats = ob.chats;
		// If there are chats to process, process them 
		if(processChats.length > 0) {
			processChats.forEach((chat: string) => { 			// loop over each chat in processChats
				let option = document.createElement("option");  // create an option element for each chat
				option.value = chat; 							// set options value and innerHTML to the chat
				option.innerHTML = chat;
				(document.getElementById("chatWindow") as HTMLSelectElement).appendChild(option); // append to chat window
				option.scrollIntoView(); 						// scroll new chats into view
			})
		};

	// Pull gold and bananas out of updates object
	let gold = ob.gold;
	let bananas = ob.bananas;
	
	// Update gold and bananas
	(document.getElementById("gold") as HTMLElement).innerHTML = gold;
	(document.getElementById("bananas") as HTMLElement).innerHTML = bananas;
}

function requestUpdates() {
	let payload = {
		action: "update",
		id: g_id,
	};

	httpPost('ajax.html', payload, (ob) => on_receive_updates(ob));
}

//=============================================================
//                       CLASS BREAK
//=============================================================
class Features {
	kind: number;
	x: number;
	y: number;
	image: HTMLImageElement;

	constructor(kind: number, x: number, y: number) {
		this.kind = kind;
		this.x = x;
		this.y = y;
		this.image = new Image();
		this.image.src = `${thing_names[kind]}.png`;
	}

	update(){}
}

//=============================================================
//					   CLASS BREAK
//=============================================================

class Sprite {
	name: string;
	x: number;
	y: number;
	id: string;
	speed: number;
	image: HTMLImageElement;
	dest_x: number | undefined;
	dest_y: number | undefined;

	update: () => void;
	onclick: (x: number, y: number) => void;
	
	
	constructor(name: string, x: number, y: number,id: string, image_url: string, update_method: () => void, onclick_method: (x: number, y: number) => void) {
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

	set_destination(x: number, y: number) {
		this.dest_x = x;
		this.dest_y = y;
	}
	

	ignore_click(x: number, y: number) {}

	move(dx: number, dy: number) {
		this.dest_x = this.x + dx;
		this.dest_y = this.y + dy;
	}

	go_toward_destination() {
        if (this.dest_x === undefined || this.dest_y === undefined) return;

        if (this.x < this.dest_x) this.x += Math.min(this.dest_x - this.x, this.speed);
        else if (this.x > this.dest_x) this.x -= Math.min(this.x - this.dest_x, this.speed);

        if (this.y < this.dest_y) this.y += Math.min(this.dest_y - this.y, this.speed);
        else if (this.y > this.dest_y) this.y -= Math.min(this.y - this.dest_y, this.speed);
    }

	sit_still() {}
}

const center_x = 500;
const center_y = 270;
const scroll_rate = 0.05;

//=============================================================
//                       CLASS BREAK
//=============================================================

class Model {

	turtle: Sprite;
	features: Features[] = [];
	
	constructor() {
		this.turtle = new Sprite(playerName, 50, 50, g_id, "blue_robot.png", Sprite.prototype.go_toward_destination, Sprite.prototype.set_destination);
		newSprites.push(this.turtle);

		this.features = [];
	}

	addFeature(kind: number, x: number, y: number) {
		let image = new Image();
		image.src = `${thing_names[kind]}.png`;
		let newFeature = new Features(kind, x, y);
		this.features.push(newFeature);
	}

	update() {
		for (const sprite of newSprites) {
			sprite.update();
		}
	}

	onclick(x: number, y: number) {
			this.turtle.onclick(x, y);
	}

	move(dx: number, dy: number) {
		this.turtle.move(dx, dy);
	}
}

//=============================================================
//                       CLASS BREAK
//=============================================================

class View
{
	model: Model;
	canvas: HTMLCanvasElement;
	turtle: HTMLImageElement;
	featureImages: HTMLImageElement[] = [];

	global_scroll_x = 0;
	global_scroll_y = 0;
	
	constructor(model: Model) {
		this.model = model;
		this.canvas = document.getElementById("myCanvas") as HTMLCanvasElement;
		this.turtle = new Image();
		this.turtle.src = "blue_robot.png";

		this.featureImages = [];

		for (let i = 0; i < thing_names.length; i++) {
			let image = new Image();
			image.src = `${thing_names[i]}.png`;
			this.featureImages.push(image);
		}
		this.get_map();
	}

	update() {
		const ctx = this.canvas.getContext("2d");

		this.global_scroll_x += scroll_rate * (this.model.turtle.x - this.global_scroll_x - center_x);
		this.global_scroll_y += scroll_rate * (this.model.turtle.y - this.global_scroll_y - center_y);

		if (ctx) {
			ctx.clearRect(0, 0, 1000, 500);
			for (const sprite of newSprites) {
				ctx.drawImage(sprite.image, ((sprite.x - sprite.image.width / 2) - this.global_scroll_x), ((sprite.y - sprite.image.height) - this.global_scroll_y));
				
				ctx.font = "20px Monocraft";
				ctx.fillText(sprite.name, ((sprite.x - sprite.image.width / 2) - this.global_scroll_x), ((sprite.y - sprite.image.height - 10) - this.global_scroll_y));
			}
			for (const feature of this.model.features) {
				ctx.drawImage(feature.image, ((feature.x - feature.image.width / 2) - this.global_scroll_x), ((feature.y - feature.image.height) - this.global_scroll_y));
			}
		}
	}

	get_map() {
		let payload = {
			action: "get_map",
		};

		httpPost('ajax.html', payload, (ob) => this.mapReceived(ob));
	}

	mapReceived(ob: any) {
		
		if(ob.status === 'error') {
			console.error(`Error: ${ob.message}`);
			return;
		}

		if (ob.status === 'map') {
			for (let i = 1; i < ob.map.things.length; i++) {
				let object = ob.map.things[i];
				let objectKind = object.kind;
				let objectX = object.x;
				let objectY = object.y;

				this.model.addFeature(objectKind, objectX, objectY);
			}
		}

	}
}

//=============================================================
//                       CLASS BREAK
//=============================================================

class Controller
{
	model: Model;
	view: View;
	key_right: boolean = false;
	key_left: boolean = false;
	key_up: boolean = false;
	key_down: boolean = false;

	lastUpdatesRequestTime: number = 0;
	updateInterval: number = 1000; // 1 second interval

	constructor(model: Model, view: View) {
		this.model = model;
		this.view = view;
		this.key_right = false;
		this.key_left = false;
		this.key_up = false;
		this.key_down = false;
		let self = this;
		view.canvas.addEventListener("click", function(event) { self.onClick(event); });
		document.addEventListener('keydown', function(event) { self.keyDown(event); }, false);
		document.addEventListener('keyup', function(event) { self.keyUp(event); }, false);
	}

	onClick(event: MouseEvent) {
		const x = event.pageX - this.view.canvas.offsetLeft + this.view.global_scroll_x;
		const y = event.pageY - this.view.canvas.offsetTop + this.view.global_scroll_y;
		this.model.onclick(x, y);
		
		// Send move request to server
		httpPost('ajax.html', {
			action: 'move',
			id: g_id,
			name: playerName,
			x: x,
			y: y,
		}, 
		
		this.onAcknowledgeClick);
	}

	onAcknowledgeClick(ob: any) {
		if (ob.status === 'error') {
			console.error(`Error: ${ob.message}`);
			return;
		}

		if (ob.status === 'moved') {
			console.log(`Move received: ${JSON.stringify(ob)}`);
			return;
		}
	}

	keyDown(event: KeyboardEvent) {
		if(event.keyCode == 39) this.key_right = true;
		else if(event.keyCode == 37) this.key_left = true;
		else if(event.keyCode == 38) this.key_up = true;
		else if(event.keyCode == 40) this.key_down = true;
	}

	keyUp(event: KeyboardEvent) {
		if(event.keyCode == 39) this.key_right = false;
		else if(event.keyCode == 37) this.key_left = false;
		else if(event.keyCode == 38) this.key_up = false;
		else if(event.keyCode == 40) this.key_down = false;
	}

	update() {
		let dx = 0;
		let dy = 0;
        let speed = this.model.turtle.speed;
		if(this.key_right) dx += speed;
		if(this.key_left) dx -= speed;
		if(this.key_up) dy -= speed;
		if(this.key_down) dy += speed;
		if(dx != 0 || dy != 0)
			this.model.move(dx, dy);

		// Is it time to request updates
		const currentTime = Date.now();
		if (currentTime - this.lastUpdatesRequestTime >= this.updateInterval) {
			this.lastUpdatesRequestTime = currentTime;
			requestUpdates();
		}
	}
}

//=============================================================
//                       CLASS BREAK
//=============================================================

class Game {
	model: Model;
	view: View;
	controller: Controller;

	constructor() {
		this.model = new Model();
		this.view = new View(this.model);
		this.controller = new Controller(this.model, this.view);
	}

	onTimer() {
		this.controller.update();
		this.model.update();
		this.view.update();
	}
}

function startGame() {
	playerName = (document.getElementById('name') as HTMLInputElement).value;
    console.log('user entered name: ' + playerName);

	if (!playerName) {
		console.error('Player name is null or empty');
		return;
	}
	
	insertCanvas();
    console.log(`Starting game for ${playerName}...`);
    let game = new Game();
    let timer = setInterval(() => { game.onTimer(); }, 40);
}

interface HttpPostCallback {
	(x:any): any;
}

const random_id = (len:number) => {
    let p = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    return [...Array(len)].reduce(a => a + p[Math.floor(Math.random() * p.length)], '');
}

const g_origin = new URL(window.location.href).origin;
//const g_origin = 'http://jacquard.ddns.uark.edu:8080';
const g_id = random_id(12);

// Payload is a marshaled (but not JSON-stringified) object
// A JSON-parsed response object will be passed to the callback
const httpPost = (page_name: string, payload: any, callback: HttpPostCallback) => {
	let request = new XMLHttpRequest();
	request.onreadystatechange = () => {
		if(request.readyState === 4)
		{
			if(request.status === 200) {
				let response_obj;
				try {
					response_obj = JSON.parse(request.responseText);
				} catch(err) {}
				if (response_obj) {
					callback(response_obj);
				} else {
					callback({
						status: 'error',
						message: 'response is not valid JSON',
						response: request.responseText,
					});
				}
			} else {
				if(request.status === 0 && request.statusText.length === 0) {
					callback({
						status: 'error',
						message: 'connection failed',
					});
				} else {
					callback({
						status: 'error',
						message: `server returned status ${request.status}: ${request.statusText}`,
					});
				}
			}
		}
	};
	request.open('post', `${g_origin}/${page_name}`, true);
	request.setRequestHeader('Content-Type', 'application/json');
	request.send(JSON.stringify(payload));
}
