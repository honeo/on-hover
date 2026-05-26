# on-hover
* [honeo/on-hover](https://github.com/honeo/on-hover)
* [on-hover](https://www.npmjs.com/package/on-hover)


## なにこれ
JS制御によるHoverイベントの実装。

[MouseEvent](https://developer.mozilla.org/ja/docs/Web/API/MouseEvent)を継承している。

__[Demo](https://honeo.github.io/on-hover/test/index.html)__

### 注意
CSSの :hover 状態とは異なる。

## 使い方
```bash
$ npm i on-hover
```
```js
import onHover from 'on-hover';
```

## onHover(element|selector [, options])
引数1の要素またはselectorと一致する要素にhoverイベント(hoverin, hoverout)を実装する。

```js
// element
onHover(element);
element.addEventListener('hoverin', (e)=>{
	console.log(e.clientX, e.clientY); // number, number
});
element.addEventListener('hoverout', listener);

/*
	selector
		matchはhover時に行う
*/
onHover('div.hoge');
document.querySelectorAll('div.hoge')[2501].addEventListener('hoverin', listener);

// global
onHover('*');
document.body.firstElementChild.addEventListener('hoverin', listener);


/*
	options
*/

// options
{
	signal: abortSignal, // イベント解除用
	delay: 100, // ms, hover判定までの猶予ms
	inset: '10%' // "%|px", hover判定を猶予する要素外周からの距離
}

// options.signal
const abort = new AbortController();
onHover(element, {signal: abort.signal});
element.addEventListener('hoverout', (e)=>{
	abort.abort()
}, {once: true});
```
