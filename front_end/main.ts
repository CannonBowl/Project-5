class Sprite {
	x: number;
	y: number;
	id: string;
	speed: number;
	image: HTMLImageElement;
	dest_x: number | undefined;
	dest_y: number | undefined;

	update: () => void;
	onclick: (x: number, y: number) => void;
	
	
	constructor(x: number, y: number,id: string, image_url: string, update_method: () => void, onclick_method: (x: number, y: number) => void) {
		this.x = x;
		this.y = y;
		this.id = id;
        this.speed = 16;
		this.image = new Image();
		this.image.src = image_url;
		this.update = update_method;
		this.onclick = onclick_method;
	}

	set_destination(x: number, y: number) {
		this.dest_x = x;
		this.dest_y = y;
	}
	

	ignore_click(x: number, y: number) {
	}

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

	sit_still() {
	}
}

//=============================================================
//                       CLASS BREAK
//=============================================================

class Model {
	sprites: Sprite[];
	turtle: Sprite;
	
	constructor() {
		this.sprites = [];
		//this.sprites.push(new Sprite(200, 100, "lettuce.png", Sprite.prototype.sit_still, Sprite.prototype.ignore_click));
		this.turtle = new Sprite(50, 50, g_id, "blue_robot.png", Sprite.prototype.go_toward_destination, Sprite.prototype.set_destination);
		this.sprites.push(this.turtle);
	}

	update() {
		for (const sprite of this.sprites) {
			sprite.update();
		}
	}

	onclick(x: number, y: number) {
		for (const sprite of this.sprites) {
			sprite.onclick(x, y);
		}
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
	
	constructor(model: Model) {
		this.model = model;
		this.canvas = document.getElementById("myCanvas") as HTMLCanvasElement;
		this.turtle = new Image();
		this.turtle.src = "blue_robot.png";
	}

	update() {
		const ctx = this.canvas.getContext("2d");
		if (ctx) {
			ctx.clearRect(0, 0, 1000, 500);
			for (const sprite of this.model.sprites) {
				ctx.drawImage(sprite.image, sprite.x - sprite.image.width / 2, sprite.y - sprite.image.height);
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
		const x = event.pageX - this.view.canvas.offsetLeft;
		const y = event.pageY - this.view.canvas.offsetTop;
		this.model.onclick(x, y);

		httpPost('ajax.html', {
			id: g_id,
			action: 'move',
			x: x,
			y: y,
		}, 
		
		this.onAcknowledgeClick);
	}

	onAcknowledgeClick(ob: any) {
		console.log(`Response to move: ${JSON.stringify(ob)}`);
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
			this.requestUpdates();
		}
	}

	on_receive_updates(ob: any) {

		for (let i = 0; i < ob.updates.length; i++) {
			//extract objects from updates
			let update = ob.updates[i];
			let update_id = update[0];
			let update_x = update[1];
			let update_y = update[2];
			// if the incoming id is my id, continue
			if (update_id == g_id) {
				continue
			}

			//find the sprite with id update-id
			let found = false;
			for (let sprite of this.model.sprites) {
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
				let newSprite = new Sprite(update_x, update_y, update_id, "green_robot.png", Sprite.prototype.go_toward_destination, Sprite.prototype.ignore_click);
				this.model.sprites.push(newSprite);

			}
		}
	}

	requestUpdates() {
		let payload = {
			action: 'iwantupdates',
			id: g_id,
		};

		httpPost('ajax.html', payload, (ob) => this.on_receive_updates(ob));
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


let game = new Game();
let timer = setInterval(() => { game.onTimer(); }, 40);

interface HttpPostCallback {
	(x:any): any;
}

const random_id = (len:number) => {
    let p = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    return [...Array(len)].reduce(a => a + p[Math.floor(Math.random() * p.length)], '');
}

const g_origin = new URL(window.location.href).origin;
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