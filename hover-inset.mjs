/*
	要素内のカーソル座標を返す
		args
			1: MouseEventインスタンス
			2: op, object
		result
			object
*/
function hoverInset(mouseEvent, options={mode: 'px'}){
	const obj_rect = mouseEvent.currentTarget.getBoundingClientRect();
	let { top, bottom, left, right } = {
		top: mouseEvent.clientY - obj_rect.top,
		bottom: obj_rect.bottom - mouseEvent.clientY,
		left: mouseEvent.clientX - obj_rect.left,
		right: obj_rect.right - mouseEvent.clientX,
	};

	if(options.mode === '%'){
		top = Math.round((top / obj_rect.height) * 100);
		bottom = Math.round((bottom / obj_rect.height) * 100);
		left = Math.round((left / obj_rect.width) * 100);
		right = Math.round((right / obj_rect.width) * 100);
	}
	return {top, bottom, left, right};
}

export default hoverInset;
