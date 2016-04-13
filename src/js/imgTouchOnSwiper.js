define([
	'/js/config.js',
    'jquery',
    'EventEmitter'
	],function(cfg, $, EventEmitter){

	var imgTouchScale = function(opts){
		EventEmitter.call(this);
        this.opts = opts || {};
        this.filePreview = opts.filePreview;

        //声明对象
        this.$touchContainer = $("#file_player");
        this.$imgList = $("#file_player").find('.swiper-lazy');
        this.$nowImg  = this.$imgList.eq(0);
        //声明变量
        this.windowW = this.$touchContainer.width();//视口宽高
        this.windowH = this.$touchContainer.height();
        this.nowIndex = 0;
        this.startAX  = 0;//第一根指头的位置
        this.startAY  = 0;
        this.endAX  = 0;
        this.endAY  = 0;
       	//缩放中用到的变量
		//两指距离
		this.preDistance = 0;//上一次距离
		//当前图片的初始宽高
		this.nowImgBaseW = 0;
		this.nowImgBaseH = 0;
		//最大缩放比例，最大缩放值
		this.imgMaxScale = 2;
		this.nowImgMaxW  = 0;
		//当前图片的偏移量
		this.nowImgLeft = 0;
		this.nowImgTop = 0;
		this.maxDragTop = 0;//拖拽的最大高度
		this.minDragTop = 0;
		this.dragPadding = 10;//拖动的时候，离边框的最大距离
		//已经向左，或者向右拉到了底
		this.dragMaxL = false;
		this.dragMaxR = false;
		// 长图拖拽,最大/小值
		this.longImgMinTop = 0;
		this.longImgMaxTop = 0;
		//当前长图距离顶端的距离
		this.longImgTop = 0;
	};

	//初始化
	imgTouchScale.prototype.init = function(){
		var o = this;

		// console.log(this.filePreview);

		//检查图片是否加载出来了
		o.checkImgLoad(1000);

		//初始化图片的大小
		o.initImgSize(o.$imgList,true);
		//为容器绑定事件
		o.touchFun(o.$touchContainer[0]);

		//因为要执行resize，所以先把o挂在到了window下
		window.o = o;
		// console.log("放大缩小初始化开始");
	}

	//改变当前img对象
	imgTouchScale.prototype.getNowImgObj = function(){
        var o = this;

        o.filePreview.Swiper.events.on("change-page", function(pageIndex){
        	//上之前的这张图，恢复到最佳比例
        	o.makeImgShowBast( o.$nowImg,false );

			// 更新当前图片对象
			o.$nowImg = o.$imgList.eq(pageIndex);
			o.nowIndex = pageIndex;

			//恢复原来的值
			this.dragMaxL = false;
			this.dragMaxR = false;

			console.log(pageIndex);
			$("#pA").text(o.nowIndex);
        });

    };

    //手指按下，触发事件,需要绑定的容器
    imgTouchScale.prototype.touchFun = function(con){
    	var o = this;
    	//把0，挂载在con对象上，为了解决传递参数问题
    	con.o = o;
    	con.addEventListener('touchstart',o.touchStartFun,false);
    }

    //开始触发，touchstart
    imgTouchScale.prototype.touchStartFun = function(obj){
    	//this指向con，
    	var o = this.o;
    	// console.log( o.$nowImg );
    	event.preventDefault();
        var touch = event.touches;
        o.startAX = touch[0].clientX;
        o.startAY = touch[0].clientY;
        o.endAX = o.startAX;//为了防止原地点击，导致的翻页
        o.endAY = o.startAY;

        //获取当前图片的宽度
        var nowImgW = o.$nowImg.width(),
        	nowImgH = o.$nowImg.height();

        //如果是一根手指，且图片的宽度小于屏幕宽度，解锁,且，如果是长图的话，可以拖拽
        if (touch.length == 1 && nowImgW <= o.windowW ) {//如果是一根指头，且图片的宽度已经超过了windowW
        	//锁住swiper lockSwipes/unlockSwipes
        	// o.filePreview.Swiper.player.unlockSwipes();

        	//当前图片距离顶端的距离
        	o.longImgTop = parseInt( o.$nowImg.css("top") );

        	// 初始化大长图的最大偏移量,longImgMinTop,longImgMaxTop
        	o.longImgMinTop = o.windowH > nowImgH ? (o.windowH - nowImgH)/2 : o.windowH - nowImgH;
        	o.longImgMaxTop = o.windowH > nowImgH ? (o.windowH - nowImgH)/2 : 0;

        	//移除放大,放大拖拽
        	this.removeEventListener('touchmove',o.imgScale,false);
        	this.removeEventListener('touchend',o.imgScaleEnd,false);
        	this.removeEventListener('touchmove',o.imgDragMove,false);
        	this.removeEventListener('touchend',o.imgDragEnd,false);

        	//添加长图拖拽的事件
        	this.addEventListener('touchmove',o.dragLoneImgMove,false);
        	this.addEventListener('touchend',o.dragLoneImgEnd,false);
        	$("#pA").text("解锁,长图可以上下拖动");
        }
		
		//如果是一根指头，且图片的宽度已经超过了windowW,那么拖拽图片,并且
        if (touch.length == 1 && nowImgW > o.windowW ) {
        	//锁住swiper lockSwipes/unlockSwipes
        	o.filePreview.Swiper.player.lockSwipes();

        	$("#pA").text("移动图片");

        	//当前的偏移量
			o.nowImgLeft = parseInt(o.$nowImg.css('left'));
        	o.nowImgTop  = parseInt(o.$nowImg.css('top'));
        	//计算Top的最大值和最小值
	        o.maxDragTop = o.windowH > nowImgH ? (o.windowH - nowImgH - o.dragPadding ) : o.dragPadding;
	        o.minDragTop = o.windowH > nowImgH ? o.dragPadding : (o.windowH - nowImgH - o.dragPadding);

	        //移除放大,长图拖拽
        	this.removeEventListener('touchmove',o.imgScale,false);
        	this.removeEventListener('touchend',o.imgScaleEnd,false);
        	this.removeEventListener('touchmove',o.dragLoneImgMove,false);
        	this.removeEventListener('touchend',o.dragLoneImgEnd,false);

	        //绑定事件
        	this.addEventListener('touchmove',o.imgDragMove,false);
        	this.addEventListener('touchend',o.imgDragEnd,false);
        }

		//如果是两根/大于两根指头,进行缩放操作
        if (touch.length >= 2 ) {
        	//矫正位置,矫正容器位置，原本是一根指头拖动，同时第二根指头进行放大操作
        	o.filePreview.Swiper.player.slideTo(o.nowIndex,200, false);
        	//锁住swiper lockSwipes/unlockSwipes
        	o.filePreview.Swiper.player.lockSwipes();

        	var startBX = touch[1].clientX;
        	var startBY = touch[1].clientY;

        	//获取原来图片的大小
        	o.getNowImgBaseSize();
        	//初始化原来两指的距离
        	o.preDistance = Math.sqrt( Math.pow( startBX - o.startAX ,2) + Math.pow( startBY - o.startAY ,2) );

        	//移除单指方法
        	this.removeEventListener('touchmove',o.dragLoneImgMove,false);
        	this.removeEventListener('touchmove',o.dragLoneImgEnd,false);
        	this.removeEventListener('touchmove',o.imgDragMove,false);
        	this.removeEventListener('touchend',o.imgDragEnd,false);

        	//添加捏合的方法,放大缩小结束方法
        	this.addEventListener('touchmove',o.imgScale,false);
        	this.addEventListener('touchend',o.imgScaleEnd,false);

        	$("#pA").text("原来两点的距离" + o.preDistance );
        }

    }

    //长图拖拽。move
    imgTouchScale.prototype.dragLoneImgMove = function(){
    	var o = this.o;

    	event.preventDefault();
    	var touch = event.touches[0];
    	var endY = touch.clientY;

    	//图片上下滚动
		var moveT = endY - o.startAY + o.longImgTop;

		moveT = moveT < o.longImgMinTop ? o.longImgMinTop : moveT;
		moveT = moveT > o.longImgMaxTop ? o.longImgMaxTop : moveT;

		o.$nowImg.css({
			'top':moveT,
			'transition':'all 0'
		})
    	$("#pB").text("上下拖拽：min" + o.longImgMinTop + 'M：' + moveT );
    }

    // 长图上下拖拽，结束
    imgTouchScale.prototype.dragLoneImgEnd = function(){
    	var o = this.o;

    	// 更新当前对象
    	o.updateNowImg();

    	this.removeEventListener('touchmove',o.dragLoneImgMove,false);
        this.removeEventListener('touchend',o.dragLoneImgEnd,false);
    }

    //双指的放大缩小
    imgTouchScale.prototype.imgScale = function(){
    	//拿出当前根对象
    	var o = this.o;

    	//双指触发的时候，隐藏下方的导航
		$("#footerContainer_un").hide();

    	event.preventDefault();
        var touch = event.touches;
        var endAX = touch[0].clientX;
        var endAY = touch[0].clientY;
	    var endBX = touch[1].clientX;
	    var endBY = touch[1].clientY;

	    var oldImgW = o.$nowImg.width();
	    var showldW = 0;
	    //求出两点的距离,三角定理
	    var nowDistance = Math.sqrt( Math.pow( endBX - endAX ,2) + Math.pow( endBY - endAY ,2) );
		//现在的差值
	    var distance = nowDistance - o.preDistance;

	   	showldW = oldImgW + distance * 5;
	   	showldW = showldW < o.windowW / 2 ? o.windowW / 2 : showldW;
	   	showldW = showldW > o.nowImgMaxW ? o.nowImgMaxW : showldW;

	    //改变图片的小
	    o.$nowImg.css({
	    	'width': parseInt(showldW),
	    	'height': parseInt(showldW * o.nowImgBaseH / o.nowImgBaseW),
	    	'left': parseInt((o.windowW - showldW)/2),
	    	'top': parseInt((o.windowH - showldW * o.nowImgBaseH / o.nowImgBaseW)/2),
	    	'transition':'all 0'
	    });

	    $("#pA").text(oldImgW);
	    $("#pB").text( o.preDistance + " || " + nowDistance );

	    //更新o.preDistance的值
	    o.preDistance = nowDistance;
    }
    //图片缩放结束
    imgTouchScale.prototype.imgScaleEnd = function(){
    	var o = this.o;
    	if ( o.$nowImg.width() > o.windowW) {
			o.isScale = true;

			//隐藏出下方按钮
			$("#footerContainer_un").hide();
		}else{//小于屏幕的大小，那么，图片需要回弹到原始比例
			o.isScale = false;
			//调用回弹方法
			o.makeImgShowBast(o.$nowImg,true);
			// 解锁swiper
			o.filePreview.Swiper.player.unlockSwipes();

			//显示出下方按钮
			$("#footerContainer_un").show();
		}
		$("#pA").text("缩放结束方法执行了，当前的缩放" + isScale);
		this.removeEventListener('touchmove',imgScale,false);
		this.removeEventListener('touchend',imgScaleEnd,false);
    }

    //放大后，拖拽
    imgTouchScale.prototype.imgDragMove = function(){
    	//拿出当前根对象
    	var o = this.o;

    	event.preventDefault();
        var touch    = event.touches[0],
        	dragEndX = touch.clientX,
        	dragEndY = touch.clientY;

        //当前应该移动的值
        var moveL = dragEndX - o.startAX + o.nowImgLeft,
        	moveT = dragEndY - o.endAY + o.nowImgTop;

        //给移动的值限定区间	
        moveL = moveL > o.dragPadding ? o.dragPadding : moveL;
        moveL = moveL < (o.windowW - o.$nowImg.width() - o.dragPadding) ? (o.windowW - o.$nowImg.width() - o.dragPadding) : moveL;
        moveT = moveT > o.maxDragTop ? o.maxDragTop : moveT;
        moveT = moveT < o.minDragTop ? o.minDragTop : moveT;

        o.$nowImg.css({
        	'left':moveL,
        	'top':moveT,
        	'transition':'all 0'
        });

        if ( o.dragMaxL && moveL == o.dragPadding ) {//左边
        	this.removeEventListener('touchmove',o.imgDragMove,false);
        	this.removeEventListener('touchend',o.imgDragEnd,false);
        	o.filePreview.Swiper.player.unlockSwipes();

        	//移除掉原来的touchend
        	this.removeEventListener('touchend',o.imgDragEnd,false);
        	//添加新的
        	this.addEventListener('touchend',o.imgDragSwiperEnd,false);
        }

        if ( o.dragMaxR && parseInt(o.$nowImg.css('left')) == (o.windowW - o.$nowImg.width() - o.dragPadding) ) {//左边
        	this.removeEventListener('touchmove',o.imgDragMove,false);
        	this.removeEventListener('touchend',o.imgDragEnd,false);
        	o.filePreview.Swiper.player.unlockSwipes();
        	//移除掉原来的touchend
        	this.removeEventListener('touchend',o.imgDragEnd,false);
        	//添加新的
        	this.addEventListener('touchend',o.imgDragSwiperEnd,false);
        }	

        $("#pA").text( 'W' + o.$nowImg.width() + 'H' + o.$nowImg.height() );
        $("#pB").text('L' + moveL +'||T' + moveT + '||MT' + (dragEndY - o.endAY) + 'OT' + o.nowImgTop);
    }

    //图片放大后，拖拽完毕
    imgTouchScale.prototype.imgDragEnd = function(){
    	//拿出当前根对象
    	var o = this.o;

    	//判断当前的状态是否是拖动到了边缘，如果是拖到了边缘，那么执行上一张或者下一张
		if ( parseInt(o.$nowImg.css('left')) == o.dragPadding ) {//左边，执行上一页
			//已经拉到了最左边
			o.dragMaxL = true;
			$("#pA").text("已经拉到了最左边，再向左边会翻页");
		}else{
			o.dragMaxL = false;
		}

		if ( parseInt(o.$nowImg.css('left')) == (o.windowW - o.$nowImg.width() - o.dragPadding) ) {//右边，执行下一页
			//已经拉到了最右边
			o.dragMaxR = true;
			$("#pA").text("已经拉到了最右边,再向右边边会翻页");
		}else{
			o.dragMaxR = false;
		}

		this.removeEventListener('touchmove',o.imgDragMove,false);
        this.removeEventListener('touchend',o.imgDragEnd,false);
    }

    //图片放大，拖拽触发swiper后
    imgTouchScale.prototype.imgDragSwiperEnd = function(){
    	//拿出当前根对象
    	var o = this.o;

    	// 更新当前对象
    	o.updateNowImg();

		this.removeEventListener('touchend',o.imgDragSwiperEnd,false);
    }

    //让当前图片显示成最佳比例
    imgTouchScale.prototype.makeImgShowBast = function(imgList,animate){
    	var o = this;

    	var $popImg     = imgList,
			thisAnimate = '';
		if (animate) {
			thisAnimate = 'all 0.3s';
		}else{
			thisAnimate = 'all 0'
		}	

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
					if ( imgW < o.windowW && imgH < o.windowH ) {
						showW = imgW;
						showH = imgH;
						// console.log('宽高，都小于屏幕宽高，那么按照原比例显示');
					}else{
						showW = o.windowW;
						showH = o.windowW*imgH/imgW;
					}
					//如果是短图，那么垂直居中，如果是大长图，那么top = 0
					thisImg.css({
						'width':showW,
						'height':showH,
						'left': (o.windowW -showW)/2,
						'top':(o.windowH -showH)/2 < 0 ? 0 : (o.windowH -showH)/2,//如果图片的高度超过了屏幕，那么视为长图，顶端
						'transition':thisAnimate
					});
				});
			})($popImg.eq(i))
		}
    }

    //更新当前图片的原始宽高，更新最大值
    imgTouchScale.prototype.getNowImgBaseSize = function(){
    	var o = this;

    	var $img = $("<img>").attr('src',o.$nowImg.attr('src'));
		
		$img.load(function(){
			//原始图片的宽高
			o.nowImgBaseW = $img[0].width;
			o.nowImgBaseH = $img[0].height;
			//最大值
			o.nowImgMaxW  = o.nowImgBaseW * o.imgMaxScale;

			// console.log(o);

		})
    }

    //初始化图片的宽高,接受参数，恢复当前图片对象的大小
    imgTouchScale.prototype.initImgSize = function($imgs,animate){
    	var $popImg     = $imgs,
			thisAnimate = '',
			m 			= this;
		if (animate) {
			thisAnimate = 'all 0.3s';
		}else{
			thisAnimate = 'all 0'
		}
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
					if ( imgW < m.windowW && imgH < m.windowH ) {
						showW = imgW;
						showH = imgH;
						// console.log('宽高，都小于屏幕宽高，那么按照原比例显示');
					}else{
						showW = m.windowW;
						showH = m.windowW*imgH/imgW;
					}
					//如果是短图，那么垂直居中，如果是大长图，那么top = 0
					thisImg.css({
						'width':showW,
						'height':showH,
						'left': (m.windowW -showW)/2,
						'top':(m.windowH -showH)/2 < 0 ? 0 : (m.windowH -showH)/2,
						'transition':thisAnimate
					});
				});
			})($popImg.eq(i))
		}
    }

    //当touchend结束的时候，更新当前对象
    imgTouchScale.prototype.updateNowImg = function(){
    	var o = this;

    	//获取现在的index
    	var swiperIndex = o.filePreview.Swiper.player.activeIndex;

    	if ( swiperIndex != o.nowIndex ) {//翻页成功
    		//恢复原来的值
			this.dragMaxL = false;
			this.dragMaxR = false;

			//恢复一下原来图片的大小位置
			o.makeImgShowBast(o.$nowImg,false);
			$("#pB").text('SI' + swiperIndex + 'oI' +o.nowIndex + '翻页了,恢复这个图片的大小');

			//由于o.filePreview.Swiper.events.on("change-page"检测不到这个事件的改变，所以手动的去更改现在的对象
			o.$nowImg = o.$imgList.eq(swiperIndex);
			o.nowIndex = swiperIndex;

			//显示出下方按钮
			$("#footerContainer_un").show();
		}	
    }


    /*
		检查图片是否加载成功，如果加载成功，那么隐藏loading层
		好悲伤，为什么img.load不行？？
		所以：用了暴力的方法，延迟执行
    */

    imgTouchScale.prototype.checkImgLoad = function(T){
    	var o = this;
    	console.log("图片加载中");

    	$(window).ready(function(){
    		setTimeout(function(){
    			$("#loadingConatiner_un").hide();
	    		$("#pA").text("已经加载完成");
    		},T);
	    });
    }

    //当屏幕大小改变的时候，那么更新一下值
    $(window).resize(function(){
    	var o = window.o;
    	o.windowW = $("#file_player").width();//视口宽高
        o.windowH = $("#file_player").height();

        //初始化图片的大小
		o.initImgSize(o.$imgList,true);

		console.log("重新定义大小");
    });

	return imgTouchScale;
	
});