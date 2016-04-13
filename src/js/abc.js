
(function(){
	var obj = function(){
		this.num = 123;

		this.init();

		return obj;
	}

	obj.prototype.init = function(){
		this.showNum();
	}

	obj.prototype.showNum = function(){
		console.log(this.num);
	}





})();


var a = new obj();

	console.log(a);
