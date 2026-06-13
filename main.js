let fileReadCount = 0;
let timelineNowIndex = 0;

const fileInput = document.getElementById("fileInput");
const isRuby = false;

const commentId = [];//日付順に並べた自分のコメントid　返信の親コメントは無い
const commentData = {};//コメid：　コメントデータ
const channelData = {
    "unknown": {
        handle: "削除済み",
        icon: ""
    }
};//チャンネルid：　ハンドル、アイコン


const analyzeResult = {
    comments: 0,//返信含め全コメント
    replies: 0,//返信だけ
    combo: 0,
    average: 0,
}

class Comment {
    commentId;
    channelId;
    date;
    topCommentId;
    text;
}

let isYouTubeAllComment = false;

//ファイル解凍して読み込んで、整理されたコメントのデータを作る
const fileAnalyzer = {
    //一番最初の
    start() {
        if (fileInput.files.length === 0) {
            //ファイルが選択されていない
            alert("ファイル選択して、どうぞ");
            return;
        }

        let isTakeoutFile;
        if (isRuby) {
            isTakeoutFile = window.confirm("Takeoutファイルですか？");
        } else {
            isTakeoutFile = true;
        }
        //isYouTubeAllComment = window.confirm("YAJU&U以外のコメントも表示しますか？");
        isYouTubeAllComment = false;

        /*const analyzeButton = document.getElementById("analyzeButton");
        analyzeButton.innerText = "分析中";
        analyzeButton.style = "background-color: gray; touch-action: none;";*/
        document.getElementById("fileInputWrapper").innerHTML = "読み込み中";

        //選択されたすべてのファイルを読む
        for (let i = 0; i < fileInput.files.length; i++) {
            const file = fileInput.files[i];
            fileAnalyzer.fileCheck(file, isTakeoutFile);
        }
    },

    //それぞれのファイルをチェック（？）
    fileCheck(file, isTakeoutFile) {
        //console.log(file);
        if (isTakeoutFile) {
            fileAnalyzer.unzipFile(file);
        } else {
            readYajuhaiFile(file);
        }
    },

    //チェック後Takeoutファイルとして解凍
    unzipFile(file) {
        const reader = new FileReader();

        reader.onload = function (e) {
            const zip = new JSZip();
            zip.loadAsync(e.target.result).then((contents) => {
                //残りの解析するファイル数
                let fileLength = (Object.keys(contents.files).length);

                // ZIPファイルの内容を処理
                Object.keys(contents.files).forEach((filename) => {
                    //console.log(filename);

                    // 各ファイルのデータを取得
                    zip.file(filename).async('text').then((fileData) => {
                        fileLength--;
                        fileAnalyzer.readUnzippedFile(fileData, fileLength);
                    });
                });
            });
        };

        reader.readAsArrayBuffer(file);
    },

    //解凍後のファイルを読む
    //全部読み終わったらコメント分析開始
    readUnzippedFile(data, fileLength) {
        //内容をオブジェクトにしたりしてcommentIdTimelineに追加したりする
        fileAnalyzer.CSVparseAndPush(data);

        if (fileLength === 0) {
            console.log("ファイル読み込み終わり！！！！！！！！！！！！！！");
            fileReadCount++;

            //すべてのファイルを読み込み終わっていたなら、コメント分析開始
            if (fileInput.files.length === fileReadCount) {
                //console.log(commentId);
                //console.log(commentData);

                commentAnalyzer.analyzeComments();
            }
        }
    },

    //csvをパースしてコメントまとめ配列に追加
    CSVparseAndPush(data) {
        let result = [];//commentオブジェクトを全部入れた配列...みたいな？

        let parsedData = Papa.parse(data)["data"];
        parsedData.shift();//解説部分を消す

        for (let i = 0; i < parsedData.length; i++) {
            const comment = new Comment();
            const tmpLast = parsedData[i].length - 1;//csvの行？がファイルごとに違ったりするから後ろから数えるときに使います

            //謎の空白行を読み込まない（csv変換のやつ変えたから必要ないかも）
            if (parsedData[i] || true) {
                //YAJU&Uかどうか
                if (parsedData[i][tmpLast - 2] === "niKAylKNIEI" || isYouTubeAllComment) {
                    comment.commentId = parsedData[i][0];
                    comment.channelId = parsedData[i][1];
                    comment.date = new Date(parsedData[i][2]);
                    comment.topCommentId = parsedData[i][tmpLast];

                    let parsedText = "";
                    JSON.parse("[" + parsedData[i][tmpLast - 1] + "]").forEach((element) => {
                        parsedText = parsedText + element.text;
                    })
                    comment.text = parsedText;

                    //theTrueResult[commentIndex][4] = convertUnkomojiretuToYarimasunemojiretu(theTrueResult[commentIndex][4]);
                    //一時的（多分）に消してる

                    //コメントカウント
                    analyzeResult.comments += 1;
                    if (comment.topCommentId !== "")
                        analyzeResult.replies += 1;

                    //コメントを配列に追加するとき、日付順にしたいので配列を挿入する位置を計算する
                    let index = 0;
                    if (commentId.length !== 0) {
                        //↑commentIdになんも入ってない時はここをしない　エラーになるから

                        //日付を比較してどの場所に追加するか決める
                        while (getCommentByIndex(index) !== undefined && getCommentByIndex(index).date < comment.date) {
                            index++;
                        }
                    }

                    //コメント情報に追加
                    commentData[comment.commentId] = comment;


                    //↓返信コメントの表示は動的？にされるようになったから下の処理はしない

                    //タイムライン配列に追加
                    //if (comment.topCommentId === "" || true) {
                    //通常コメント
                    commentId.splice(index, 0, comment.commentId);
                    /*} else {
                        //親コメントがある場合
                        if (alreadyTopComment.includes(comment.topCommentId) === false) {
                            //親コメントがまだタイムライン配列に追加されてないなら
                            commentId.splice(index, 0, comment.topCommentId);
                            alreadyTopComment.push(comment.topCommentId);
                        }
                    }*/
                }
            }
        }
    }
}

//整理されたコメントデータを使って連続数とかを分析して表示
const commentAnalyzer = {

    //コメントの分析を開始！
    analyzeComments() {

        console.log(commentId.length);


        if (isRuby) {
            console.log(commentId);
        }

        //前回の分析データとして保存を試みる
        try {
            localStorage.setItem("My_YAJU&U_comment", JSON.stringify({ commentId: commentId, commentData: commentData }));
        } catch (error) {
            alert(error);
        }

        document.getElementById("fileInputScreen").remove();
        const el = document.querySelectorAll(".analyzePannel2")[0];
        document.getElementById("analyzeScreen").style.display = "flex";

        if (isYouTubeAllComment) {
            el.children[0].innerText = ("YouTubeに合計 " + analyzeResult.comments + " コメントしました");
        } else {
            el.children[0].innerText = ("YAJU&Uに合計 " + analyzeResult.comments + " コメントしました");
        }

        el.children[1].innerText = ("（通常:" + (analyzeResult.comments - analyzeResult.replies) + " 返信:" + analyzeResult.replies + "）");

        commentAnalyzer.caculateCommentCombo();
        el.children[2].innerText = ("最高 " + analyzeResult.combo + " 日連続コメント");

        commentAnalyzer.caculateCommentAverage();
        el.children[3].innerText = ("一日平均 " + analyzeResult.average + " コメント");

        if (isRuby) {
            document.getElementById("backgroundImage").style.display = "block";
        }
        //createCommentHoursTable()

        const topCommentWithMyComment = [];//すでにどれかと紐づけ済みか確認

        //親コメントと子コメントを紐づける
        commentId.forEach((element) => {
            //返信コメントかつ紐づけ配列にまだ無いなら
            if (getCommentById(element).topCommentId !== "" && !topCommentWithMyComment.includes(getCommentById(element).topCommentId)) {
                getCommentById(element).showAsTopcomment = true;//紐づける
                topCommentWithMyComment.push(getCommentById(element).topCommentId);//すでに紐づけ済みですよ
            } else {
                topCommentWithMyComment.push(element);//親コメントとして出現済みなので出ませんよ
            }
        })
        //console.log(topCommentWithMyComment);


        timeliner.resetDate();
        timeliner.pageChange(true);

        console.warn(analyzeResult);
    },

    caculateCommentCombo() {
        let checkDate = new Date();
        let nowCommentCombo = 0;

        //全部の日を調べて最大コメント連続日数を計算
        while (checkDate.getFullYear() !== 2023) {

            //checkDateの日付があるか検索
            const isCommentFound = commentId.some((element) =>
                getCommentById(element).date.getFullYear() === checkDate.getFullYear() &&
                getCommentById(element).date.getMonth() === checkDate.getMonth() &&
                getCommentById(element).date.getDate() === checkDate.getDate()
            );

            if (isCommentFound) {
                nowCommentCombo++;
                //現在の連続数が最大の連続数を超えたら、連続数を更新
                if (nowCommentCombo > analyzeResult.combo) {
                    analyzeResult.combo = nowCommentCombo;
                }
            } else {
                //連続数途切れ
                nowCommentCombo = 0;
            }

            //次の日も調べるために次の日にする
            checkDate.setDate(checkDate.getDate() - 1);
            //console.log(allComment[i][2].substr(0, 4) +"/"+ allComment[i][2].substr(5, 2) +"/"+ allComment[i][2].substr(8, 2));
        }
    },

    caculateCommentAverage() {
        const firstCommentDate = getCommentByIndex(0).date;
        const lastCommentDate = getCommentByIndex(analyzeResult.comments - 1).date;
        let commentCount = 0;

        commentId.forEach((element) => {
            if (firstCommentDate <= getCommentById(element).date && lastCommentDate >= getCommentById(element).date) {
                commentCount++;
            }
        })

        //コメントしてから現在（最後にコメントした日）の日数
        const dayLength = Math.round((lastCommentDate.getTime() - firstCommentDate.getTime()) / (1000 * 60 * 60 * 24));
        analyzeResult.average = Math.round((commentCount / dayLength) * 100) / 100;
    }
}

const timeliner = {
    nextIndex: 0,//次のページの開始位置
    backIndex: 0,//ページ戻るときの開始位置
    nowDetailComment: undefined,

    //
    resetDate() {
        const sortSelectorElement = document.getElementById("timelineSortSelector");
        const dateElement = document.getElementById("timelineDate");
        if (sortSelectorElement.value === "older") {
            const date = getCommentByIndex(0).date;
            dateElement.value = date.toISOString().substring(0, 10);
        } else if (sortSelectorElement.value === "newer") {
            const date = getCommentByIndex(analyzeResult.comments - 1).date;
            dateElement.value = date.toISOString().substring(0, 10);
        }

        if (sortSelectorElement.value === "random") {
            dateElement.style.display = "none";
        } else {
            dateElement.style.display = "block";
        }

        dateElement.min = getCommentByIndex(0).date.toISOString().substring(0, 10);
        dateElement.max = getCommentByIndex(analyzeResult.comments - 1).date.toISOString().substring(0, 10);
    },

    //タイムラインの新しいページを表示するときに、表示するコメントIdを調べたりapi関係のそれをする
    async timelineRequest(isGoNextpage) {
        const timelineArray = [];//タイムラインに表示させたい最終的なコメントid達

        let commentElementCount = 0;

        let nowIndex;
        if (isGoNextpage) {
            nowIndex = timeliner.nextIndex;
            timeliner.backIndex = nowIndex - 1;
        } else {
            nowIndex = timeliner.backIndex;
            timeliner.nextIndex = nowIndex + 1;
        }

        //console.log(nowIndex);

        //20コメント表示、または端につくまで
        while (commentElementCount < 20 && nowIndex < analyzeResult.comments && 0 <= nowIndex) {
            //console.log("while");

            const nowCommentId = getCommentByIndex(nowIndex).commentId;
            const topCommentId = getCommentById(nowCommentId).topCommentId;

            if (topCommentId === "") {
                //通常コメントなら
                timelineArray.push(nowCommentId);
                commentElementCount++;
            } else if (getCommentById(nowCommentId).showAsTopcomment === true) {
                //返信コメントだけど親コメントに結び付けられてるやつなら
                timelineArray.push(topCommentId);
                if (getCommentById(topCommentId) === undefined)
                    commentData[topCommentId] = {
                        channelId: undefined, commentId: topCommentId, text: ""
                    };//コメントの情報がundefinedだとあれなので追加はしておく
                commentElementCount++;
            }

            if (isGoNextpage) {
                nowIndex++;
            } else {
                nowIndex--;
            }
        }

        if (isGoNextpage) {
            timeliner.nextIndex = nowIndex;
        } else {
            timeliner.backIndex = nowIndex;
        }


        const needChannelId = [];
        const needCommentId = [];

        //情報がまだない場合は取得しますね配列に入れる
        timelineArray.forEach((element) => {
            const comment = getCommentById(element);

            if (channelData[comment.channelId] === undefined && !needChannelId.includes(comment.channelId)) {
                //チャンネル情報
                if (comment.channelId !== undefined)//エラーにならないようにとりあえず追加しといたchannelIdの場合はここで追加する必要はない
                    needChannelId.push(comment.channelId);
                //channelData[comment.channelId] = { handle: "削除済みコメント", icon: "" };

                /*channelData[comment.channelId] = {
                    handle: "@horihoriadwt",
                    icon: "https://yt3.ggpht.com/fIsxN5NyFebZ1Tzpv92IVn4eRSKXfSZNtMP_mUUicii1dNHrFjXmdLD7S0X7CVNvVxhGlEyIcQ=s48-c-k-c0x00ffffff-no-rj"
                }*/
            }
            if (commentData[comment.commentId].channelId === undefined && !needCommentId.includes(comment.commentId)) {
                //コメント情報
                needCommentId.push(comment.commentId);
                commentData[comment.commentId].channelId = "unknown";

            }
        })

        if (needChannelId.length > 0 || needCommentId.length > 0) {
            console.log("fetch");

            await fetch(["https://script.google.com/macros/s/AKfycbyVqCtriDqwdJu3PD6CmePkNssSOmwnHumG0qs-5JNkYN87LsYgKuyTlbsUEnpoz55K/exec"], {
                "method": "POST",
                /*"Access-Control-Allow-Origin": "*",*/
                "body": JSON.stringify({
                    "type": "newPage",
                    "needChannelId": needChannelId,
                    "needCommentId": needCommentId
                }),
                "Content-Type": "application/json"
            })
                .then(responce => {
                    return responce.json();
                })
                .then(json => {
                    console.warn(json);

                    //jsonの処理
                    Object.keys(json.channelData).forEach((element) => {
                        channelData[element] = json.channelData[element];
                    })
                    Object.keys(json.commentData).forEach((element) => {
                        commentData[element] = json.commentData[element];
                        commentData[element].date = new Date(commentData[element].date);
                        //親コメント投稿者のチャンネル情報もあるからそっちも
                        channelData[json.commentData[element].channelId] = json.commentData[element].channelData;
                        delete commentData[element].channelData;
                    })
                })
        }

        return timelineArray;
    },


    //別ページに移動
    async pageChange(isGoNextpage) {//nextは次のページに行くならtrue、前のページに行くならfalse
        console.log("timeline");

        const el = await document.getElementById("timelineCommentWrapper");
        el.innerHTML = "読み込み中";

        const timelineArray = await timeliner.timelineRequest(isGoNextpage);

        //createTimelineElements();
        //console.warn("create!");
        timeliner.createTimelineElements(timelineArray, isGoNextpage);
    },

    createTimelineElements(array, isGoNextpage) {
        const wrapper = document.getElementById("timelineCommentWrapper");

        if (isGoNextpage) {
            array.forEach((element) => {
                wrapper.appendChild(createCommentElement(getCommentById(element)));
            })
        } else {
            array.forEach((element) => {
                wrapper.prepend(createCommentElement(getCommentById(element)));
            })
        }
    },

    jumpDate(value) {
        const date = new Date(value);
        let checkDate = 0;
        let index;

        for (let i = 0; checkDate < date; i++) {
            checkDate = getCommentByIndex(i).date;
            index = i;
        }

        timeliner.nextIndex = index;
        timeliner.backIndex = index - 1;
        timeliner.pageChange(true);
    },

    async showDetail(commentId) {
        const comment = getCommentById(commentId);
        timeliner.nowDetailComment = comment;
        //console.error(commentId);

        document.getElementById("commentDetailScreen").style.display = "block";
        const commentWrapper = document.getElementById("detailCommentWrapper");
        commentWrapper.innerHTML = "";
        commentWrapper.appendChild(createCommentElement(comment, true));

        const repliesWrapper = document.getElementById("repliesWrapper");
        repliesWrapper.innerHTML = "";

        //返信がまだ取得できてないなら
        if (comment.repliesId === undefined) {
            //awaitでfetchとかして返信データを取得とか
            await fetch(["https://script.google.com/macros/s/AKfycbyVqCtriDqwdJu3PD6CmePkNssSOmwnHumG0qs-5JNkYN87LsYgKuyTlbsUEnpoz55K/exec"], {
                "method": "POST",
                "body": JSON.stringify({
                    "type": "getReplies",
                    "topCommentId": commentId,
                }),
                "Content-Type": "application/json"
            })
                .then(responce => {
                    return responce.json();
                })
                .then(json => {
                    console.warn(json);
                    comment.repliesId = [];

                    //jsonの処理
                    json.forEach((element) => {
                        channelData[element.channelId] = element.channelData;

                        commentData[element.commentId] = element;
                        commentData[element.commentId].date = new Date(commentData[element.commentId].date);
                        delete commentData[element.commentId].channelData;
                        comment.repliesId.push(element.commentId);
                    })
                })
        }

        //返信を表示
        await comment.repliesId.forEach((element) => {
            repliesWrapper.appendChild(createCommentElement(getCommentById(element), true));
        })
    }
}



//ここからはじまる
document.getElementById("analyzeButton").onclick = fileAnalyzer.start;
fileInput.addEventListener("change", fileAnalyzer.start, false);


//コメント詳細画面閉じる
document.getElementById("closeDetailScreenButton").addEventListener("click", closeDetailScreen);
function closeDetailScreen(){
    document.getElementById("commentDetailScreen").style.display = "none";
}
//コメントの時刻に移動
document.getElementById("jumpDetailCommentDateButton").addEventListener("click", function(e){
    closeDetailScreen();
    timeliner.jumpDate(timeliner.nowDetailComment.date);
});
//YouTubeでコメントを見る
document.getElementById("showDetailCommentInYouTube").addEventListener("click", function(e){
    const a = document.createElement("a");
    a.href = "https://www.youtube.com/watch?v=niKAylKNIEI&lc=" + timeliner.nowDetailComment.commentId;
    a.target = "_blank";
    a.click();
});

//分析結果コピーボタン
document.getElementById("copyTextButton").onclick = function () {
    const el = document.querySelectorAll(".analyzePannel2")[0];

    el.children[0]
    navigator.clipboard.writeText(
        el.children[0].innerText + "\n" +
        el.children[1].innerText + "\n" +
        el.children[2].innerText + "\n" +
        el.children[3].innerText
    );

    this.innerText = "コピーしました";
};


//ランダムな数字を返すTDN便利な関数
function getRandomNumber(min, max) {
    return Math.floor(Math.random() * (max - min) + min);
}

//コメント要素を生成して返す
function createCommentElement(comment, isHideDetailButton) {
    if(comment.channelId === "unknown")
        isHideDetailButton = true;

    const container = document.createElement("div");
    container.classList.add("commentContainer");
    container.dataset.commentid = comment.commentId;
    const channelIcon = document.createElement("img");
    channelIcon.classList.add("channelIcon");
    channelIcon.src = channelData[comment.channelId].icon;
    const textContainer = document.createElement("div");
    textContainer.classList.add("commentTextContainer");
    const handleAndDate = document.createElement("p");
    handleAndDate.innerText = generateTimeText(comment.date) + "・" + channelData[comment.channelId].handle;
    handleAndDate.classList.add("handleAndDate");
    const text = document.createElement("p");
    text.innerText = comment.text;
    text.style = "color: white; overflow-wrap: break-word; white-space: pre-wrap; word-wrap: break-word;"
    /*const a = document.createElement("a");
    a.innerText = "詳細";
    a.href = "https://www.youtube.com/watch?v=niKAylKNIEI&lc=" + comment.commentId;
    a.target = "_blank";
    a.style = "white-space: nowrap;"*/
    const detailButton = document.createElement("button");
    detailButton.innerText = "詳細を見る";
    detailButton.classList.add("commentDetailButton");
    detailButton.addEventListener("click", function (e) { timeliner.showDetail(e.currentTarget.parentElement.parentElement.dataset.commentid) });


    /*const about = document.createElement("span");
    about.innerText = " " + array[2].getFullYear() + "/" + array[2].getMonth() + "/" + array[2].getDate() + " " + array[2].getHours() + ":" + array[2].getMinutes() + ":" + array[2].getSeconds();
    about.innerText = comment.date.toLocaleString();
    about.style = "margin: 0 0 0 8px; color: gray; white-space: nowrap;"*/

    /*const rowDiv = document.createElement("div");
    rowDiv.style = "word-break: break-word;";*/

    //parentElement.appendChild(container);
    container.appendChild(channelIcon);
    container.appendChild(textContainer);
    textContainer.appendChild(handleAndDate);
    textContainer.appendChild(text);
    //textContainer.appendChild(rowDiv);
    /*if(comment.channelId !== "unknown")
        rowDiv.appendChild(a);*/
    if (isHideDetailButton !== true){
        textContainer.appendChild(detailButton);
    }else{
        container.style.paddingBottom = "16px";
    }
    //rowDiv.appendChild(about);

    return container;
}



//下のやつがresetTimelineもやってくれるからこっちは要らないかも？
/*document.getElementById("timelineSortSelector").addEventListener("change", function () {
    //console.log("sortselectorChange");
    
    timelineManager.resetTimelineDate();
}, false)*/

document.getElementById("timelineDate").addEventListener("change", function (e) {
    timeliner.jumpDate(e.currentTarget.value);
}, false)
document.getElementById("timelinePreviousPage").addEventListener("click", function (e) {
    timeliner.pageChange(false);
}, false)
document.getElementById("timelineNextPage").addEventListener("click", function (e) {
    timeliner.pageChange(true);
}, false)

//タイムラインを実際に表示させる
function createTimelineElements() {
    const el = document.getElementById("timelineCommentWrapper");
    const filter = document.getElementById("timelineFilterSelector").value;
    const sort = document.getElementById("timelineSortSelector").value;

    let index = timelineNowIndex;
    for (let i = timelineNowIndex; i < timelineNowIndex + 50; i++) {
        if (sort === "random") {
            index = getRandomNumber(0, analyzeResult.comments);
        }

        if (filter === "comment") {
            if (commentId[index][3] === "") {
                createCommentElement(el, commentId[index]);
            }
        } else if (filter === "reply") {
            if (commentId[index][3] !== "") {
                createCommentElement(el, commentId[index]);
            }
        } else {
            createCommentElement(el, commentId[index]);
        }

        if (sort === "older") {
            index++;
        } else if (sort === "newer") {
            index--;
        }
    }

    if (sort === "older") {
        timelineNowIndex += 50;
    } else if (sort === "newer") {
        timelineNowIndex -= 50;
    }
}

document.getElementById("timelineMoreButton").onclick = createTimelineElements;


//え？
function convertUnkomojiretuToYarimasunemojiretu(inputArray) {
    inputArray.forEach((element, index) => {
        let result;

        //textなら
        if (element.indexOf("text") !== - 1) {
            //文字列 text がある位置を基準にすれば最初の余計な部分を消せる
            const startIndex = element.indexOf("text") + 9
            result = element.substring(startIndex);

            //最後の余計な部分を消す
            if (index === inputArray.length - 1) {
                //最後の項目には"が最後に一つついているので1文字多く削る必要がある
                result = result.substring(0, result.length - 4);
            } else {
                result = result.substring(0, result.length - 3);

            }

            inputArray[index] = result;
        } else {
            //textじゃないなら消す
            inputArray[index] = "";
        }
    })

    return inputArray.join("");
}


function useLastFile() {
    const getArray = localStorage.getItem("My_YAJU&U_comment");

    if (getArray === null) {
        alert("（前回のデータが）ないです。")
    } else {
        document.getElementById("fileInputWrapper").innerHTML = "読み込み中";

        commentId = JSON.parse(getArray);

        //日付のデータが文字列になっちゃってるから直す
        commentId.forEach((element, index) => {
            commentId[index][2] = new Date(element[2]);
        })

        commentAnalyzer.analyzeComments();
    }
}

document.getElementById("useLastFile").onclick = useLastFile;



function deleteLastFile() {
    const answer = confirm("前回の分析データを消しますか？");

    if (answer) {
        //消す
        localStorage.removeItem("My_YAJU&U_comment");
    }
}

document.getElementById("deleteLastFile").onclick = deleteLastFile;


function createCommentHoursTable() {
    if (isRuby) {
        document.getElementById("commentHoursTable").style.display = "flex"
    }

    let commentHoursTable = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    commentId.forEach((element) => {
        commentHoursTable[element[2].getHours()]++;
    })

    /*let commentHoursTable = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    allComment.forEach((element) => {
    commentHoursTable[element[2].getMonth()]++;
    })*/

    createCommentHoursTableElement(commentHoursTable);
}

function createCommentHoursTableElement(array) {
    const wrapper = document.getElementById("commentHoursTable");
    const max = Math.max(...array);

    for (let i = 0; i < array.length; i++) {
        const text = document.createElement("li");
        const graph = document.createElement("li");
        graph.classList.add("graph");
        text.classList.add("graphHour");
        graph.style.width = (array[i] / max * 90) + "%";
        graph.innerText = array[i];
        text.innerText = i + " 時";

        wrapper.children[0].appendChild(text);
        wrapper.children[1].appendChild(graph);
    }
}


function readYajuhaiFile(file) {
    const reader = new FileReader();
    let text;

    reader.addEventListener("load", function () {
        yajuhaiCSVConvert(reader.result);
    }, true)

    reader.readAsText(file);
}


function yajuhaiCSVConvert(data) {
    let tmp = data.split("\n");
    const result = [];
    //console.log(tmp);

    /*tmp.forEach((element, index) => {
        const textEndIndex = element.lastIndexOf(",");

        const one = [];
        one.push(element.substring(0, 26));
        one.push(element.substring(27, 51));
        one.push(element.substring(textEndIndex + 1, element.length - 1));
        one.push("");
        one.push(element.substring(52, textEndIndex));

        result.push(one);
    })*/

    let hikitugi = "";
    //固定コメントが重複しているためiは1から
    for (let i = 1; i < tmp.length; i++) {
        let element = hikitugi + "" + tmp[i];

        //console.log(element);

        //ひとまとまりのコメント行じゃなかった場合
        if (element.charAt(element.length - 2) !== "Z") {
            i++;
            hikitugi = element;
            continue;
        }

        const textEndIndex = element.lastIndexOf(",");

        const one = [];
        one.push(element.substring(0, 26));
        one.push(element.substring(27, 51));
        one.push(element.substring(textEndIndex + 1, element.length - 1));
        one.push("");
        one.push(element.substring(52, textEndIndex));

        result.push(one);

        hikitugi = "";
    }

    //console.log(result);
    commentId = result.reverse();

    //日付のデータが文字列になっちゃってるから直す
    commentId.forEach((element, index) => {
        commentId[index][2] = new Date(element[2]);
    })

    commentAnalyzer.analyzeComments();
}


//～年～か月前の文章を生成
function generateTimeText(date) {
    //return "テスト中";

    if (date === undefined)
        return "不明";

    let text = "";
    const today = new Date();
    let year = 0;
    let month = 0;

    const checker = new Date();
    checker.setTime(today.getTime() - date.getTime());

    //年
    year = checker.getFullYear() - 1970;
    if (year >= 1) {
        text = text + year + "年";
    }
    month = checker.getMonth();
    if (year >= 1 || month > 0) {
        //月
        if (month !== 0)
            text = text + month + "か月";
    } else {
        //日
        text = text + (checker.getDate() - 1) + "日";
    }

    return text + "前";
}



function getCommentById(id) {
    return commentData[id];
}

function getCommentByIndex(index) {
    return commentData[commentId[index]];
}


/*
ボタン押す
ファイル読み込み開始
すべてのファイルの読み込み終わってるか確認
終わってたらCSVから読みやすい配列に変換
コメント分析開始
*/

/*
メモ

allComment
[0]コメントid
[1]チャンネルid
[2]日付
[3]親コメントid
[4]本文
*/

/*
最古のコメが最初、最新のコメが最後
*/