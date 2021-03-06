/**
 * Created by Yehh on 2017/4/5.
 */
//注意event.offsetX是相对于事件源左上角的坐标
//event.clientX是相对于浏览器可视区左上角的坐标
$(function () {
    //公共变量
    var controlPanle = {width: 970, height: 960};
    var blockDockStatus = [];       //记录指令块停靠的位置索引
    var blockInitPos = [];          //记录指令块的其实位置，界面左侧2列、8行
    var groovePos = [];             //记录指令槽的位置

    var scale = 0;

    //////////////////////////////////////////////////////////////////
    //函数定义
    //////////////////////////////////////////////////////////////////
    /**
     * 文档初始化事件响应
     */
    var init = function () {
        //////////////////////////////////////////////////////////////////
        //设置控制面板图像的大小
        //////////////////////////////////////////////////////////////////
        scale = parseFloat($('.left').css('height'))/controlPanle.height;
        controlPanle.width *= scale;
        controlPanle.height = parseFloat($('.left').css('height'));
        $('.right').css('width', controlPanle.width + 'px').css('height', controlPanle.height + 'px');

        //////////////////////////////////////////////////////////////////
        //设置指令槽的位置和大小
        //////////////////////////////////////////////////////////////////
        $('.groove').each(function () {
            var left = parseFloat($(this).css('left')) - 459;       //459和262偏移量参考psd设计文件
            var top = parseFloat($(this).css('top')) - 262;
            var width = parseFloat($(this).css('width'));
            var height = parseFloat($(this).css('height'));
            left *= scale;
            top *= scale;
            width *= scale;
            height *= scale;

            $(this).css('left', left + 'px');
            $(this).css('top', top + 'px');
            $(this).css('width', width + 'px');
            $(this).css('height', height + 'px');
            $(this).css('background-size', '100% 100%');
            $(this).css('z-index', 1);
            $(this).css('opacity', 0);
        });

        //////////////////////////////////////////////////////////////////
        //初始化停靠状态
        //////////////////////////////////////////////////////////////////
        blockDockStatus = [];
        $('.blocks img').each(function () {
            $(this).css('z-index', 5);      //设置z-index

            var index = $(this).attr('id').split('-')[1];
            index = parseInt(index);
            blockDockStatus[index] = -1;
        });

        resize();
    };

    /**
     * 文档尺寸改变事件响应
     */
    var resize = function () {
        //////////////////////////////////////////////////////////////////
        //设置指令块的初始位置
        //////////////////////////////////////////////////////////////////
        blockInitPos = [];
        $('td img').each(function () {
            var index = $(this).attr('id').split('-')[1];
            index = parseInt(index);

            //保存指令停靠位置
            blockInitPos[index] = {};
            blockInitPos[index].x = $(this).offset().left;
            blockInitPos[index].y = $(this).offset().top;
        });

        //////////////////////////////////////////////////////////////////
        //记录指令槽的位置（相对文档左上角的坐标），即指令块的停靠位置
        //////////////////////////////////////////////////////////////////
        groovePos = [];
        $('.groove').each(function () {
            var index = $(this).attr('id').split('-')[1];
            index = parseInt(index);
            groovePos[index] = {};
            groovePos[index].x = $(this).offset().left;
            groovePos[index].y = $(this).offset().top;

            //修正指令槽大小和指令块大小不一样导致的偏移
            groovePos[index].x += (parseFloat($(this).css('width')) - parseFloat($('#img-0').css('width')))/2;
            groovePos[index].y += (parseFloat($(this).css('height')) - parseFloat($('#img-0').css('height')))/2;
        });

        //////////////////////////////////////////////////////////////////
        //根据指令的停靠状态，来设置其位置
        //////////////////////////////////////////////////////////////////
        $('.blocks img').each(function () {
            var index = $(this).attr('id').split('-')[1];
            index = parseInt(index);
            if (blockDockStatus[index] < 0) {   //指令块未停靠时，将其放置到起始位置
                $(this).css('left', blockInitPos[index].x + 'px');
                $(this).css('top', blockInitPos[index].y + 'px');
            } else {    //停靠到对应的指令槽
                $(this).css('left', groovePos[blockDockStatus[index]].x + 'px');
                $(this).css('top', groovePos[blockDockStatus[index]].y + 'px');
            }
        });
    };

    /**
     * 获取元素相对于文档左上角的坐标位置
     * @param {string | object} element 元素id或html对象
     */
    var getPosition = function (element) {
        if (typeof element === 'string') {
            element = '#' + element;
            element = $(element).get(0);
        }

        var parent = null;
        var position = {x:0, y:0};
        do {
            position.x += element.offsetLeft;
            position.y += element.offsetTop;
            element = element.offsetParent;
        } while (element);

        return position;
    };

    /**
     * 移动元素动画
     * @param {string | object} element 元素id或html对象
     * @param {object} destPos 目标位置
     * @param {number} spead 移动速度，单位为像素
     */
    var move = function (element, destPos, spead) {
        if (typeof element === 'string') {
            element = '#' + element;
        }

        var srcPos = {x:0, y:0};
        srcPos.x = $(element).offset().left;
        srcPos.y = $(element).offset().top;
        var temp = (destPos.x - srcPos.x)*(destPos.x - srcPos.x)
                    + (destPos.y - srcPos.y)*(destPos.y - srcPos.y);
        var length = Math.sqrt(temp);
        var time = length/spead;

        var style = {
            top: destPos.y,
            left: destPos.x
        };

        $(element).animate(style, time);
    };

    //////////////////////////////////////////////////////////////////
    //初始化及文档大小改变事件处理
    //////////////////////////////////////////////////////////////////
    init();
    $(window).resize(function () {
        resize();
    });

    //////////////////////////////////////////////////////////////////
    //鼠标移动、按下和弹起事件处理
    //////////////////////////////////////////////////////////////////
    var position = {x:0, y:0};     //记录鼠标位置
    var count = 2;
    var selectIndex = -1;          //选中的图形索引号

    $(window).mousemove (function (e) {
        if (selectIndex < 0) {        //没有图形被选中
            return;
        }

        var id = '#img-' + selectIndex;
        var left = e.pageX - position.x;
        $(id).css('left', left+'px');
        var top = e.pageY - position.y;
        $(id).css('top', top+'px');
    }).mouseup(function (e) {
        if (selectIndex >= 0) {
            if (blockDockStatus[selectIndex] < 0) {    //选择的指令未停靠在控制面板
                destPos = blockInitPos[selectIndex];
                var id = 'img-'+ selectIndex;
                move(id, destPos, 5);
            } else {
                destPos = groovePos[blockDockStatus[selectIndex]];
                var id = 'img-'+ selectIndex;
                move(id, destPos, 5);

                $('#groove-'+blockDockStatus[selectIndex]).css('opacity', 0);
            }
        }

        //修改指令槽的z-index，使其处于指令块的下面
        $('.groove').css('z-index', 1);

        selectIndex = -1;
        position.x = 0;
        position.y = 0;
        e.preventDefault();
    });

    $('.blocks img').mousedown(function (e) {
        var id = $(this).attr('id');
        selectIndex = parseInt(id.split('-')[1]);
        position.x = e.offsetX;
        position.y = e.offsetY;
        console.log(position.x+','+position.y);

        //修改指令槽的z-index，使其处于指令块的上面，使得指令槽可以相应鼠标事件
        $('.groove').css('z-index', 10);

        if (blockDockStatus[selectIndex] >= 0) {
            $('#groove-'+blockDockStatus[selectIndex]).css('opacity', 1);
        }

        e.preventDefault();
    });

    $('.groove').mouseenter(function () {
        if (selectIndex >= 0) {
            var index = $(this).attr('id').split('-')[1];
            index = parseInt(index);

            //确保指令槽没有被指令块停靠
            for (var i = 0; i < blockDockStatus.length; i++) {
                if (blockDockStatus[i] === index) {
                    return;
                }
            }

            //功能指令块不能放置在指令槽12-15处
            if ( (selectIndex > 11) && (index > 11) ) {
                return;
            }

            //设置指令块停靠位置索引
            blockDockStatus[selectIndex] = index;
            console.log('dockindex = '+index);
            $(this).css('opacity', 1);
        }
    }).mouseout(function () {
        if (selectIndex >= 0) {
            //取消指令块的停靠
            var index = $(this).attr('id').split('-')[1];
            index = parseInt(index);
            blockDockStatus[selectIndex] = -1;
            $(this).css('opacity', 0);
        }
    });
});
