/*
	zoom.uncle 1.0.0

	作者：uncle·yang
	
	github: https://github.com/awarriorer

	最后更新：2016/4/11

	功能介绍：
	移动端图片查看器，手势放大缩小

*/

;(function(){
	'use strict';
	var $;

	/*===========================
    zoom.uncle
    ===========================*/

    var zoomUncle = function(container, params){
    	if (!(this instanceof zoomUncle)) return new zoomUncle(container, params);
    	//设置默认参数
    	var defaults = {
    		//基础设置
    		initialSlide: 0,//初始位置
    		translateTime: 300,//自动播放时间歇

    		//元素类
    		wrapperClass: 'zoomUncle-wrapper',//单元父容器
    		slideClass:'zoomUncle-slide',//操作单元
    		slideActiveClass:'zoomUncle-slide-active',//激活状态
    		slideNextClass: 'zoomUncle-slide-next',//上一个
            slidePrevClass: 'zoomUncle-slide-prev',//下一个

    	};
    	//defaults end!

    	/*
			初始化默认值
    	*/
    	params = params || {};
    	for (var def in defaults) {
            if (typeof params[def] === 'undefined') {
                params[def] = defaults[def];
            }
            else if (typeof params[def] === 'object') {
                for (var deepDef in defaults[def]) {
                    if (typeof params[def][deepDef] === 'undefined') {
                        params[def][deepDef] = defaults[def][deepDef];
                    }
                }
            }
        }

        // zoomUncle
        var u = this;

        u.params = params;

        u.classNames = [];

        //初始化 $
        if (typeof $ === 'undefined') {
            if (typeof Dom7 === 'undefined') {
                $ = window.Dom7 || window.Zepto || window.jQuery;
            }
            else {
                $ = Dom7;
            }
            if (!$) return;
        }

        u.$ = $;

        //初始化变量
        u.initVal(container);
        //程序入口
        u.init();
    }

    zoomUncle.prototype.initVal = function(container){
        var u = this;
        //初始化dom对象
        u.dom = {};

        var Dom = u.dom;

        Dom.$container = $(container);//顶级容器
        Dom.$wrapper   = Dom.$container.find('.' + u.params.wrapperClass);//单元父级容器
        Dom.$slides    = Dom.$wrapper.find('.' + u.params.slideClass);//单元容器集合
        Dom.$imgList   = Dom.$wrapper.find('img');//图片集合
        Dom.$nowImg    = Dom.$imgList.eq(0);//当前显示的，是哪张图片

        //初始化变量
        u.val = {};
        var Val = u.val;

        Val.containerW   = Dom.$container.width();//容器的宽，高
        Val.containerH   = Dom.$container.height();
        Val.slidesLen    = Dom.$slides.length;//slides的个数
        Val.startAX      = 0;//第一个指头起始,结束位置
        Val.startAY      = 0;
        Val.endAX        = 0;
        Val.endAY        = 0;
        Val.startBX      = 0;//第二个指头起始位置
        Val.startBY      = 0;
        Val.translateX   = 0;//滑动的值
        Val.bufferWidth  = Val.containerW/5;//移动多少，就可以翻页
        Val.activeIndex  = 0;//当前现实的值
    }

    zoomUncle.prototype.init = function(){
        var u   = this,
            Dom = this.dom,
            Val = this.val;

        Dom.$wrapper.css({
            'width': Val.containerW * Val.slidesLen
        });

        Dom.$slides.css({
            'width': Val.containerW
        });

        //最佳比例显示
        u.makeImgShowBast(Dom.$imgList,300);
        //为容器绑定事件
        u.touchFun(Dom.$container[0]);
        console.log(u);
    };

    //为容器添加，触摸事件
    zoomUncle.prototype.touchFun = function(con){
        var u   = this,
            Dom = u.dom,
            Val = u.val;
        //把0，挂载在con对象上，为了解决传递参数问题
        con.u = u;
        con.addEventListener('touchstart',u.touchStart,false);
    }

    //开始触摸
    zoomUncle.prototype.touchStart = function(){
        var u = this.u,
            Dom = u.dom,
            Val = u.val;


        event.preventDefault();

        var touchs  = event.touches,
            nowImgW = Dom.$nowImg.width(),
            nowImgH = Dom.$nowImg.height();

        Val.startAX = touchs[0].clientX;
        Val.startAY = touchs[0].clientY;
        Val.endAX   = Val.startAX;//为了防止原地点击，导致的翻页
        Val.endAY   = Val.startAY;

        Val.translateX = parseInt( (Dom.$wrapper.css('translate') + '').split(',')[0] );

        /*
            事件分流,
            根据指头的数量，现在图片的宽度，来进行分流
            分流前，先解除原来绑定在容器上的事件，然后绑定新的事件
        */
        if ( touchs.length == 1 && nowImgW <= Val.containerW ) {

            this.addEventListener('touchmove',u.swiperMove,false);
            this.addEventListener('touchend',u.swiperEnd,false);

        }

    }

    zoomUncle.prototype.swiperMove = function(){
        var u = this.u,
            Dom = u.dom,
            Val = u.val;

        event.preventDefault();
        var touch = event.touches[0];
        Val.endAX = touch.clientX;
        Val.endAY = touch.clientY;
        
        Dom.$wrapper.css({
            'transform':'translate(' + (Val.translateX + Val.endAX - Val.startAX) + 'px,0)',
            'transition':'all 0s'
        });
    }

    zoomUncle.prototype.swiperEnd = function(){
        var u   = this.u,
            Dom = u.dom,
            Val = u.val;

        var reduceVal = Val.endAX - Val.startAX;

        //向右边
        if (reduceVal > Val.bufferWidth ) {
            Val.activeIndex = Val.activeIndex - 1;
            Val.activeIndex = Val.activeIndex <= 0 ? 0 : Val.activeIndex;
            u.slideTo(Val.activeIndex,300);
        }
        //向左边
        if (reduceVal < - Val.bufferWidth ) {
            Val.activeIndex = Val.activeIndex + 1;
            Val.activeIndex = Val.activeIndex > Val.slidesLen - 1 ? Val.slidesLen - 1 : Val.activeIndex;
            u.slideTo(Val.activeIndex,300);
        }

        //中间的值
        if ( -Val.bufferWidth < reduceVal < Val.bufferWidth ) {
            u.slideTo(Val.activeIndex,300);
        }

        this.removeEventListener('touchmove',u.swiperMove,false);
        this.removeEventListener('touchend',u.swiperEnd,false);
    }

    zoomUncle.prototype.slideTo = function(index,time){
        var u = this,
            Dom = u.dom,
            Val = u.val;

        Dom.$wrapper.css({
            'transform': 'translate('+ (- index * Val.containerW) +'px,0)',
            'transition':'all '+ time/1000 +'s'
        });
            
    }    

    //让图片按照最佳比例显示
    zoomUncle.prototype.makeImgShowBast = function($imgList,animate){
        var u   = this,
            Dom = this.dom,
            Val = this.val;

        var $popImg = $imgList;

        for (var i = 0; i < $popImg.length; i++) {
            (function(thisImg){
                var $img = $("<img>").attr('src',thisImg.attr('src'));
                $img.load(function(){
                    var imgW   = $img[0].width,//原始图片的宽高
                        imgH   = $img[0].height,
                        showW  = 0,
                        showH  = 0,
                        showL  = 0,
                        showT  = 0;

                    //如果宽高，都小于屏幕宽高，那么按照原比例显示
                    if ( imgW < Val.containerW && imgH < Val.containerH ) {
                        showW = imgW;
                        showH = imgH;
                        // console.log('宽高，都小于屏幕宽高，那么按照原比例显示');
                    }else{
                        showW = Val.containerW;
                        showH = Val.containerW*imgH/imgW;
                    }
                    //如果是短图，那么垂直居中，如果是大长图，那么top = 0
                    thisImg.css({
                        'width':showW,
                        'height':showH,
                        'left': (Val.containerW -showW)/2,
                        'top':(Val.containerH -showH)/2 < 0 ? 0 : (Val.containerH -showH)/2,//如果图片的高度超过了屏幕，那么视为长图，顶端
                        'transition':'all ' + (animate/1000) + 's'
                    });
                });
            })($popImg.eq(i))
        }

        console.log('layout');
    }

    window.zoomUncle = zoomUncle;

})()

