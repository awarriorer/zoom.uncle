/*
	zoom.uncle 1.0.0

	作者：uncle·yang
	
	github:

	最后更新：2016/4/8

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
            maxScale:3,//最大缩放倍数
            scaleSpeed:5,//图片缩放速度
            minScaleWidth:0.5,//图片最小的值
            dragPadding:10,//可以拖拽的最大内边距
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
        Val.activeIndex  = 0,//当前现实的值
        Val.preDistance  = 0,//上次两指之间的距离
        Val.nowImgBaseW  = 0,//当前图片的原始大小
        Val.nowImgBaseH  = 0,
        Val.nowImgMaxW   = 0,//当前图片的最大缩放宽度
        Val.isScale      = false,//标记已/未放大
        Val.nowImgLeft   = 0,//当前图片的偏移量
        Val.nowImgTop    = 0,
        Val.maxDragTop   = 0,//可拖拽的距离顶端的最大/小值
        Val.minDragTop   = 0,
        Val.dragMaxL     = false,//已经拉到了最左/右边
        Val.dragMaxR     = false,
        Val.a            = 0;
    }

    zoomUncle.prototype.init = function(){
        var u   = this,
            Dom = this.dom,
            Val = this.val;

        // 初始化容器的宽度
        Dom.$wrapper.css({
            'width': Val.containerW * Val.slidesLen
        });

        Dom.$slides.css({
            'width': Val.containerW
        });
        //初始化位置
        Val.activeIndex = u.params.initialSlide;
        u.slideTo(Val.activeIndex,0);
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
        
        //移所有事件
        u.removeAllEvent();

        var touchs  = event.touches,
            nowImgW = Dom.$nowImg.width(),//当前图片的宽高
            nowImgH = Dom.$nowImg.height(),
            startBX = 0,//第二根指头
            startBY = 0;

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
        // 如果只有一根指头，且图片的宽度小于屏幕的宽度，那么执行翻页

        if ( touchs.length == 1 && nowImgW <= Val.containerW ) {
            // 添加单指事件
            this.addEventListener('touchmove',u.swiperMove,false);
            this.addEventListener('touchend',u.swiperEnd,false);
        }

        //如果是一个指头，且现在的宽度大于屏幕宽度，那么执行拖拽
        if ( touchs.length == 1 && nowImgW > Val.containerW ) {
            
            //当前的偏移量
            Val.nowImgLeft = parseInt(Dom.$nowImg.css('left'));
            Val.nowImgTop  = parseInt(Dom.$nowImg.css('top'));
            //计算Top的最大值和最小值
            Dom.maxDragTop = Val.containerW > nowImgH ? (Val.containerW - nowImgH - u.params.dragPadding ) : u.params.dragPadding;
            Dom.minDragTop = Val.containerW > nowImgH ? u.params.dragPadding : (Val.containerW - nowImgH - u.params.dragPadding);

            //添加事件
            this.addEventListener('touchmove',u.imgDragMove,false);
            this.addEventListener('touchend',u.imgDragEnd,false);
        }

        // 如果有两根指头，那么执行放大缩小的操作
        if ( touchs.length >= 2 ) {

            //滑动前，矫正当前页面的位置，翻页的同时，触摸上了第二个指头
            u.slideTo(Val.activeIndex,300);

            startBX = touchs[1].clientX;
            startBY = touchs[1].clientY;

            //获取当前图片的原始宽高
            u.getImgBaseSize();

            //初始化两指头之间的距离
            Val.preDistance = Math.sqrt( Math.pow( startBX - Val.startAX ,2) + Math.pow( startBY - Val.startAY ,2) );
            
            //添加双指放大缩小事件
            this.addEventListener('touchmove',u.imgScaleMove,false);
            this.addEventListener('touchend',u.imgScaleEnd,false);

        }

    }

    //单指翻页事件
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

    //单指翻页完毕
    zoomUncle.prototype.swiperEnd = function(){
        var u   = this.u,
            Dom = u.dom,
            Val = u.val;

        //滑动的距离    
        var reduceVal = Val.endAX - Val.startAX;

        //向右边
        if (reduceVal > Val.bufferWidth ) {
            Val.activeIndex = u.getPreIndex(Val.activeIndex);
            u.slideTo(Val.activeIndex,300);
        }
        //向左边
        if (reduceVal < - Val.bufferWidth ) {
            Val.activeIndex = u.getNextIndex(Val.activeIndex);
            u.slideTo(Val.activeIndex,300);
        }

        //中间的值
        if ( -Val.bufferWidth < reduceVal < Val.bufferWidth ) {
            u.slideTo(Val.activeIndex,300);
        }

        this.removeEventListener('touchmove',u.swiperMove,false);
        this.removeEventListener('touchend',u.swiperEnd,false);
    }

    //两指缩放
    zoomUncle.prototype.imgScaleMove = function(){
        var u = this.u,
            Dom = u.dom,
            Val = u.val;
        
        event.preventDefault();
        var touch = event.touches;
        var endAX = touch[0].clientX;
        var endAY = touch[0].clientY;
        var endBX = touch[1].clientX;
        var endBY = touch[1].clientY;

        var oldImgW = Dom.$nowImg.width();//当前图片的宽度
        var imgShowW = 0;//应该显示的宽度

        //求出两点的距离,三角定理
        var nowDistance = Math.sqrt( Math.pow( endBX - endAX ,2) + Math.pow( endBY - endAY ,2) );
       
        //现在的差值
        var distance = nowDistance - Val.preDistance;

        imgShowW = oldImgW + distance * u.params.scaleSpeed;
        imgShowW = imgShowW < Val.containerW * u.params.minScaleWidth ? Val.containerW * u.params.minScaleWidth : imgShowW;
        imgShowW = imgShowW > Val.nowImgMaxW ? Val.nowImgMaxW : imgShowW;

        //改变图片的小
        Dom.$nowImg.css({
            'width': parseInt(imgShowW),
            'height': parseInt(imgShowW * Val.nowImgBaseH / Val.nowImgBaseW),
            'left': parseInt((Val.containerW - imgShowW)/2),
            'top': parseInt((Val.containerH - imgShowW * Val.nowImgBaseH / Val.nowImgBaseW)/2),
            'transition':'all 0'
        });

        //更新Val.preDistance的值
        Val.preDistance = nowDistance;
    }

    //缩放结束
    zoomUncle.prototype.imgScaleEnd = function(){
        var u = this.u,
            Dom = u.dom,
            Val = u.val;

        if ( Dom.$nowImg.width() > Val.containerW) {
            //标记已/未放大
            Val.isScale = true;
        }else{//小于屏幕的大小，那么，图片需要回弹到原始比例
            //标记已/未放大
            Val.isScale = false;
            //调用回弹方法
            u.makeImgShowBast(Dom.$nowImg,300);
        }
        
        this.removeEventListener('touchmove',u.imgScaleMove,false);
        this.removeEventListener('touchend',u.imgScaleEnd,false); 
    }

    //图片拖拽
    zoomUncle.prototype.imgDragMove = function(){
        var u   = this.u,
            Dom = u.dom,
            Val = u.val;

        event.preventDefault();
        var touch    = event.touches[0],
            dragEndX = touch.clientX,
            dragEndY = touch.clientY;

        //当前应该移动的值
        var moveL = dragEndX - Val.startAX + Val.nowImgLeft,
            moveT = dragEndY - Val.endAY + Val.nowImgTop;

        //给移动的值限定区间 
        moveL = moveL > Val.dragPadding ? Val.dragPadding : moveL;
        moveL = moveL < (Val.containerW - Dom.$nowImg.width() - Val.dragPadding) ? (Val.containerW - Dom.$nowImg.width() - Val.dragPadding) : moveL;
        moveT = moveT > Val.maxDragTop ? Val.maxDragTop : moveT;
        moveT = moveT < Val.minDragTop ? Val.minDragTop : moveT;

        Dom.$nowImg.css({
            'left':moveL,
            'top':moveT,
            'transition':'all 0'
        });

        if ( Val.dragMaxL && moveL == Val.dragPadding ) {//左边
            //转移事件
            u.changeEvent();
        }

        if ( Val.dragMaxR && parseInt(o.$nowImg.css('left')) == (Val.containerW - Dom.$nowImg.width() - Val.dragPadding) ) {//左边
            //转移事件
            u.changeEvent();
        }
    }

    //图片拖拽结束
    zoomUncle.prototype.imgDragEnd = function(){
        var u   = this.u,
            Dom = u.dom,
            Val = u.val;

        var nowLeft = parseInt(Dom.$nowImg.css('left'));

        //判断当前的状态是否是拖动到了边缘，如果是拖到了边缘，那么执行上一张或者下一张
        if ( nowLeft == Val.dragPadding ) {//左边，执行上一页
            //已经拉到了最左边
            Val.dragMaxL = true;
            $("#pA").text("已经拉到了最左边，再向左边会翻页");
        }else{
            Val.dragMaxL = false;
        }

        if ( nowLeft == (Val.containerW - Dom.$nowImg.width() - Val.dragPadding) ) {//右边，执行下一页
            //已经拉到了最右边
            Val.dragMaxR = true;
            $("#pA").text("已经拉到了最右边,再向右边边会翻页");
        }else{
            Val.dragMaxR = false;
        }

        this.removeEventListener('touchmove',o.imgDragMove,false);
        this.removeEventListener('touchend',o.imgDragEnd,false);
    }

    //滑动到指定位置
    zoomUncle.prototype.slideTo = function(index,time){
        var u = this,
            Dom = u.dom,
            Val = u.val;

        Dom.$wrapper.css({
            'transform': 'translate('+ (- index * Val.containerW) +'px,0)',
            'transition':'all '+ time/1000 +'s'
        });

        //还原最左/右边的值
        Val.dragMaxL = false;
        Val.dragMaxR = false;

        //更新图片操作当前对象
        Dom.$nowImg = Dom.$slides.eq(index).find('img');
        //添加类
        Dom.$slides.eq(index).addClass(u.params.slideActiveClass).siblings().removeClass(u.params.slideActiveClass); 
        Dom.$slides.eq(u.getNextIndex(index)).addClass(u.params.slideNextClass).siblings().removeClass(u.params.slideNextClass); 
        Dom.$slides.eq(u.getPreIndex(index)).addClass(u.params.slidePrevClass).siblings().removeClass(u.params.slidePrevClass); 
    }
    //获取下一个index值
    zoomUncle.prototype.getNextIndex = function(index){
        var u = this,
            Dom = u.dom,
            Val = u.val;

        var nextIndex = index + 1 > Val.slidesLen - 1 ? Val.slidesLen - 1 : index + 1;
        return nextIndex;
    }

    //获取上一个index值
    zoomUncle.prototype.getPreIndex = function(index){
        var u = this,
            Dom = u.dom,
            Val = u.val;

        var pretIndex = index - 1 <= 0 ? 0 : index - 1;
        return pretIndex;
    }

    //获取图片的原始宽高
    zoomUncle.prototype.getImgBaseSize = function(){
        var u = this,
            Dom = u.dom,
            Val = u.val;

        var $img = $("<img>").attr('src',Dom.$nowImg.attr('src'));

        $img.load(function(){
            //原始图片的宽高
            Val.nowImgBaseW = $img[0].width;
            Val.nowImgBaseH = $img[0].height;
            //最大值
            Val.nowImgMaxW  = Val.nowImgBaseW * u.params.maxScale;

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
    }

    //移除所有事件
    zoomUncle.prototype.removeAllEvent = function(){
        var u   = this,
            Dom = this.dom,
            Val = this.val;

        Dom.$container[0].removeEventListener('touchmove',u.swiperMove,false);
        Dom.$container[0].removeEventListener('touchend',u.swiperEnd,false);
        Dom.$container[0].removeEventListener('touchmove',u.imgScaleMove,false);
        Dom.$container[0].removeEventListener('touchend',u.imgScaleEnd,false);
        Dom.$container[0].removeEventListener('touchmove',u.imgDragMove,false);
        Dom.$container[0].removeEventListener('touchend',u.imgDragEnd,false);
    }

    //交换事件,当大图第二次拖拽到边缘时执行
    zoomUncle.prototype.changeEvent = function(){
        var u   = this,
            Dom = this.dom,
            Val = this.val;

        //移除大图拖拽
        Dom.$container[0].removeEventListener('touchmove',o.imgDragMove,false);
        Dom.$container[0].removeEventListener('touchend',o.imgDragEnd,false);
        //添加翻页
        Dom.$container[0].addEventListener('touchmove',o.swiperMove,false);
        Dom.$container[0].addEventListener('touchend',o.swiperEnd,false);
    }

    window.zoomUncle = zoomUncle;

})()

