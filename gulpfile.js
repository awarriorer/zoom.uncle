var gulp        = require('gulp'),// 引入gulp
    //js类
    uglify      = require("gulp-uglify"),//js压缩
    htmlmin     = require("gulp-htmlmin"),//压缩html
    jshint      = require('gulp-jshint'),//js检测
    //图片压缩类
    imagemin    = require('gulp-imagemin'),//压缩图片
    pngquant    = require("imagemin-pngquant"),//pngquant来压缩png图片
    tinypng     = require("gulp-tinypng"),//tinypng 我可爱的小熊猫
    tinypngCom  = require("gulp-tinypng-compress"),
    //信息提示类
    rename      = require("gulp-rename"),//重命名
    notify      = require("gulp-notify"),//提示信息
    plumber     = require('gulp-plumber'),//水管工；堵漏人员通过gulp-plumber插件来忽略less编译错误
    //css
    less        = require('gulp-less'),//less生成css
    minifycss   = require('gulp-minify-css'),//css压缩

    // sass
    sass        = require('gulp-ruby-sass'),
    //文件合并
    concat      = require('gulp-concat'),//文件合并
    //监听
    livereload  = require('gulp-livereload'),//当代码变化时，执行实现
    browserSync = require('browser-sync').create(),//浏览器同步刷新
    a;

   
var baseUrl       = "/",//设置基础路径
    //html  
    htmlSrc       = "src/",//压缩html的路径
    htmlDestSrc   = "src/htmlMin/",//html压缩到
    //js  
    oneJsSrc      = ["src/script/*.js","!src/**/*.min.js"],//单个js压缩的路径
    onejsDest     = "src/script/",//单个js压缩的输出路径
    jsConcatSrc   = ["src/script/*.js","!src/**/*.min.js"],//js压缩合并的路径
    jsConDestSrc  = "src/script/",
    jsConcatName  = "objMain",//js合并后的名称
    //img  
    imgMinSrc     = "src/image/",//要压缩的地址
    destImgSrc    = "src/image/min/",//输出的地址
    //less  
    lessSrc       = "src/style/",//less路径
    lessDestSrc   = "src/style/",//由less生成的css路径
    //sass
    sassSrc       = "src/style/",//sass路径
    sassDestSrc   = "src/style/",//由sass生成的css路径
    //css
    cssOneSrc     = "src/style/",//单个css路径
    cssoneDestSrc = "src/style/",//单个css压缩到路径
    cssCancatSrc  = ["src/style/*.css","!src/**/*.min.css"],//要合并的css
    cssCanDestSrc = "src/style/",//要合并的css输出的路径
    cssCancatName = "main",//合并后css的名称
    //监听
    watchSrc      = ["src/**/*.*"],//服务要监听的路径
    seaverSrc     = "src",//服务开始的路径
    a;


//js语法检查
gulp.task('jsCheck', function() {
    return gulp.src(oneJsSrc)
      .pipe(jshint())
      .pipe(jshint.reporter('default'))
      .pipe(notify({ message: 'js检查没有语法问题' }));
});

//压缩单个js文件
gulp.task("jsMinOne",function(){
  return gulp.src(oneJsSrc)//读取这个路径下的js文件
    .pipe(uglify())//压缩
    .pipe(rename({suffix: '.min'})) //重命名压缩后的文件夹后缀名
    .pipe(gulp.dest(onejsDest)) //输出
    .pipe(notify({ message: 'js单个压缩成功！' }));//输出提示信息
});

//多个js压缩合并到一个文件夹
gulp.task("jsConcat",function(){
  return gulp.src(jsConcatSrc)//读取这个路径下的js文件
    .pipe(concat(jsConcatName+'.js'))//要合并的
    .pipe(gulp.dest(jsConDestSrc))//合并后js要输出的路径
    .pipe(uglify())//压缩
    .pipe(rename({suffix: '.min'})) //重命名压缩后的文件夹后缀名
    .pipe(gulp.dest(jsConDestSrc)) //输出
    .pipe(notify({ message: 'js压缩合并成功！' }));//输出提示信息
});

//压缩图片
gulp.task('imgMin', function() {
  return gulp.src(imgMinSrc+'*.+(jpeg|jpg|png|gif|svg)')
    .pipe(imagemin({
        progressive: true,
        use: [pngquant()] //使用pngquant来压缩png图片
    }))
    .pipe(gulp.dest(destImgSrc))//输出的路径
    .pipe(notify({ message: '图片压缩成功！' }));
});

//tinypng压缩图片
gulp.task('tinypng', function(){
    return gulp.src(imgMinSrc+'/*.+(jpeg|jpg|png|gif|svg)') // 源地址
    .pipe(tinypng("tinypng"))
    .pipe(gulp.dest(destImgSrc)) // 输出路径
    .pipe(notify({ message: 'tinypng图片压缩成功！' }));
});


//压缩html
gulp.task('htmlMin', function() {
  return gulp.src(htmlSrc+'*.html')
    .pipe(htmlmin({collapseWhitespace: true}))
    .pipe(gulp.dest(htmlDestSrc))
    .pipe(notify({ message: 'html 压缩完毕！' }));
});


//less
gulp.task('less', function () {
    gulp.src( lessSrc +'*.less')
        .pipe(plumber({errorHandler: notify.onError('Error: <%= error.message %>')}))
        .pipe(less())
        .pipe(gulp.dest(lessDestSrc))
        .pipe(notify({ message: 'less生成css 生成完毕！' }));
});

// sass
// gulp.task('sass', function () {
//     return sass( lessSrc +'*.scss')
//         .pipe(plumber({errorHandler: notify.onError('Error: <%= error.message %>')}))
//         .pipe(gulp.dest(lessDestSrc))
//         .pipe(notify({ message: 'sass生成css 生成完毕！' }));
// });

gulp.task('sass', function () {
  return sass(sassSrc +'*.scss')
    .pipe(plumber({errorHandler: notify.onError('Error: <%= error.message %>')}))
    .pipe(gulp.dest(sassDestSrc))
    .pipe(notify({ message: 'sass生成css 生成完毕！' }));
});

//css压缩
gulp.task('cssMinOne', function() {
  return gulp.src(cssOneSrc+'*.css')
    .pipe(minifycss())//压缩
    .pipe(rename({suffix: '.min'})) //重命名压缩后的文件夹后缀名
    .pipe(gulp.dest(cssoneDestSrc)) //输出
    .pipe(notify({ message: 'css单个压缩成功！' }));//输出提示信息
});


//css合并压缩
gulp.task("cssConcat",function(){
  return gulp.src(cssCancatSrc)//读取这个路径下的css文件
    .pipe(concat(cssCancatName+'.css'))//要合并的
    .pipe(gulp.dest(cssCanDestSrc))//合并后js要输出的路径
    .pipe(minifycss())//压缩
    .pipe(rename({suffix: '.min'})) //重命名压缩后的文件夹后缀名
    .pipe(gulp.dest(cssCanDestSrc)) //输出
    .pipe(notify({ message: 'css压缩合并成功！' }));//输出提示信息
});

//自动刷新
gulp.task('watch', function() {
  livereload.listen(); //要在这里调用listen()方法
  //监听这些路径，执行这些方法
  gulp.watch([lessSrc+'*.less',sassSrc+'*.scss'], ['less','sass']);

});


//自动刷新浏览器
// Static server
gulp.task('browser-sync', function() {
    var files = watchSrc;
    browserSync.init(files,{
        server: {
            baseDir: seaverSrc//启动服务的初始路径
        }
    });
});


gulp.task('default', function() {
    // 将你的默认的任务代码放在这
    // gulp.run('jsCheck', "");
    console.log("hello gulp,hello word!");

});