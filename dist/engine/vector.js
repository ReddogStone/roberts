export function vec(x, y) {
	return { x: x, y: y };
}

export function vclone(v) {
	return vec(v.x, v.y);
}

export function vadd(v1, v2) {
	return vec(v1.x + v2.x, v1.y + v2.y);
}
export function vsub(v1, v2) {
	return vec(v1.x - v2.x, v1.y - v2.y);
}

export function vneg(v) {
	return vec(-v.x, -v.y);
}
export function vscale(v, s) {
	return vec(v.x * s, v.y * s);
}

export function vmul(v1, v2) {
	return vec(v1.x * v2.x, v1.y * v2.y);
}

export function vdiv(v1, v2) {
	return vec(v1.x / v2.x, v1.y / v2.y);
}

export function vsqlen(v) {
	return v.x * v.x + v.y * v.y;
}

export function vlen(v) {
	return Math.sqrt(vsqlen(v));
}

export function vnorm(v) {
	var l = vlen(v);
	if (l < 0.00001) {
		return vec(0, 0);
	}
	return vscale(v, 1.0 / l);
}

export function vdir(from, to) {
	return vnorm(vsub(to, from));
}

export function vlerp(v1, v2, a) {
	return vadd(vscale(v1, 1 - a), vscale(v2, a));
}

export function veq(v1, v2) {
	return v1.x === v2.x && v1.y === v2.y;
}

export function vdot(v1, v2) {
	return v1.x * v2.x + v1.y * v2.y;
}

export function vdist(v1, v2) {
	return vlen(vsub(v2, v1));
}

export function vmap(v, func) {
	return vec(func(v.x), func(v.y));
}

export function vflip(v) {
	return vec(v.y, v.x);
}

export function vrot(v, angle) {
	var s = Math.sin(angle);
	var c = Math.cos(angle);
	return vec(v.x * c - v.y * s, v.x * s + v.y * c);
}
