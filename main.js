let allComment = [];
let oldestCommentIndex;
let commentCombo = 0;
let commentAverage;
let fileReadCount = 0;
let timelineNowIndex = 0;

const fileInput = document.getElementById("fileInput");
const isRuby = false;

let isYouTubeAllComment = false;


function files(filedata, fileLength) {
    const result = takeoutCSVconvert(filedata);

    result.forEach((element) => {
        if ((element) !== "") {
            checkComment(element);
        }
    })

    if (fileLength === 0) {
        console.log("ファイル読み込み終わり！！！！！！！！！！！！！！");
        fileReadCount++;

        //選択していたすべてのファイルを読み込み終わっていたら分析開始
        if (fileInput.files.length === fileReadCount) {
            startAnalyze();
        }
    }
}


function takeoutCSVconvert(data) {
    let splitResult = [];
    let theTrueResult = [];
    let tmp = data.split("\n");

    for (let i = 1; i < tmp.length; i++) {
        //謎の空白行を読み込まない
        if (tmp[i] !== "") {
            splitResult[i] = tmp[i].split(",");

            //YAJU&Uかどうか
            if (splitResult[i].includes("niKAylKNIEI") || isYouTubeAllComment) {
                const commentIndex = theTrueResult.length;
                theTrueResult.push([]);

                theTrueResult[commentIndex].push(splitResult[i][0]);//コメントid
                theTrueResult[commentIndex].push(splitResult[i][1]);//チャンネルid

                //投稿時間を読み取りやすい形式にする
                const timeText = splitResult[i][2];
                let date = new Date("2020-1-1T00:00:00");
                date.setUTCFullYear(timeText.substr(0, 4));
                date.setUTCMonth(timeText.substr(5, 2) - 1);
                date.setUTCDate(timeText.substr(8, 2));
                date.setUTCHours(timeText.substr(11, 2));
                date.setUTCMinutes(timeText.substr(14, 2));
                date.setUTCSeconds(timeText.substr(17, 2));

                //reresult[commentIndex].push(timeText.substr(0, 4) + "" + timeText.substr(5, 2) + "" + timeText.substr(8, 2) + "" + timeText.substr(11, 2) + "" + timeText.substr(14, 2) + "" + timeText.substr(17, 2));
                theTrueResult[commentIndex].push(date);

                theTrueResult[commentIndex].push(splitResult[i][4]);//親コメントid
                theTrueResult[commentIndex].push(splitResult[i].slice(splitResult[i].indexOf("niKAylKNIEI") + 1, splitResult[i].length - 1));//コメント内容
                //console.log(reresult[commentIndex][4]);
                //console.log(JSON.parse(reresult[commentIndex][4]));


                //コメント内容の余計な部分を消す
                /*reresult[commentIndex][4].forEach((element, index) => {
                    if (reresult[commentIndex][4].length === 1) {
                        //1行だから1文字最初と最後に入ってる余計な文字を考慮する
                        reresult[commentIndex][4][index] = element.substring(13, element.length - 4);
                    } else if (index === reresult[commentIndex][4].length - 1) {
                        //最後の行だから1文字最後に入ってる余計な文字を考慮する
                        reresult[commentIndex][4][index] = element.substring(12, element.length - 4);
                    } else if (index === 0) {
                        //最初の行だから1文字最初に入ってる余計な文字を考慮する
                        reresult[commentIndex][4][index] = element.substring(13, element.length - 3);
                    } else {
                        //通常
                        reresult[commentIndex][4][index] = element.substring(13, element.length - 4);
                    }
                })*/

                //1行にしちゃうよ
                //reresult[commentIndex][4] = reresult[commentIndex][4].join("");
                theTrueResult[commentIndex][4] = convertUnkomojiretuToYarimasunemojiretu(theTrueResult[commentIndex][4]);

                //reresult[commentIndex].push(result[i].slice(result[i].indexOf("niKAylKNIEI") + 1, result[i].length - 1));//コメント内容
            }
        }
    }
    //console.log(reresult[0][4][0]);
    return theTrueResult;
}


//コメントを分析
function checkComment(array) {
    //console.log(allComment.length);

    //allComment.push(array);

    //コメントを日付順にしたいので、配列を挿入する位置を計算する
    let index = 0;
    if (allComment.length !== 0) {
        //↑allCommentになんも入ってない時はここをしない　エラーになるから
        while (allComment[index] !== undefined && allComment[index][2] < array[2]) {
            index++;
            //console.log("index");
        }
    }
    //console.log(array[4]);
    allComment.splice(index, 0, array);


    /*//返信かどうかチェック
    if (array[3] !== "") {
        replyCommentCount++;
    }*/
}


function startAnalyze() {
    if (isRuby) {
        console.log(allComment);
    }

    /*let onlyContent = [];
    allComment.forEach((element) => { if (element[3] === "") { onlyContent.push(element[4]) } });
    console.log(onlyContent);*/
    try {
        localStorage.setItem("My_YAJU&U_comment", JSON.stringify(allComment));
    } catch (error) {
        alert(error);
    }

    document.getElementById("fileInputScreen").remove();
    const el = document.querySelectorAll(".analyzePannel2")[0];
    document.getElementById("analyzeScreen").style.display = "flex";

    //返信のコメントを数える
    const replyCommentCount = allComment.filter(element => element[3] !== "").length;

    if (isYouTubeAllComment) {
        el.children[0].innerText = ("YouTubeに合計 " + allComment.length + " コメントしました");
    } else {
        el.children[0].innerText = ("YAJU&Uに合計 " + allComment.length + " コメントしました");
    }
    el.children[1].innerText = ("（通常:" + (allComment.length - replyCommentCount) + " 返信:" + replyCommentCount + "）");

    caculateCommentCombo();
    el.children[2].innerText = ("最高 " + commentCombo + " 日連続コメント");

    caculateOldestComment();
    //getRandomComment();

    caculateCommentAverage();
    el.children[3].innerText = ("一日平均 " + commentAverage + " コメント");

    if (isRuby) {
        document.getElementById("backgroundImage").style.display = "block";
    }
    createCommentHoursTable()

    setTimelineDate();
    timeline();
}


document.getElementById("analyzeButton").onclick = startFileRead;

fileInput.addEventListener("change", startFileRead, false);


//ファイル読み込み
function readfile(file, isTakeoutFile) {
    //console.log(file);
    if (isTakeoutFile) {
        readTakeoutFile(file);
    } else {
        readYajuhaiFile(file);
    }
}

function readTakeoutFile(file) {
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
                    files(fileData, fileLength);
                });
            });
        });
    };

    reader.readAsArrayBuffer(file);
}


function caculateCommentCombo() {
    let today = new Date();
    let nowCommentCombo = 0;

    //連続コメント数を分析
    while (today.getFullYear() !== 2023) {

        //todayの日付があるか検索
        const isCommentFound = allComment.some((element) =>
            //Number(element[2].substr(0, 4)) === today.getFullYear() &&
            //Number(element[2].substr(4, 2)) === today.getMonth() + 1 &&
            //Number(element[2].substr(6, 2)) === today.getDate()
            element[2].getFullYear() === today.getFullYear() &&
            element[2].getMonth() === today.getMonth() &&
            element[2].getDate() === today.getDate()
        );
        today.setDate(today.getDate() - 1);

        if (isCommentFound) {
            nowCommentCombo++;
            //console.log(today + "にコメントされていました");

            //現在の連続数が最大の連続数を超えたら
            if (nowCommentCombo > commentCombo) {
                commentCombo = nowCommentCombo;
            }
        } else {
            nowCommentCombo = 0;
        }

        //console.log(allComment[i][2].substr(0, 4) +"/"+ allComment[i][2].substr(5, 2) +"/"+ allComment[i][2].substr(8, 2));
    }
}

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


function getRandomNumber(min, max) {
    return Math.floor(Math.random() * (max - min) + min);
}


function getRandomComment() {
    const number = getRandomNumber(0, allComment.length);
    //console.log(number);

    const random = document.getElementById("randomComment");
    //random.href = "https://www.youtube.com/watch?v=niKAylKNIEI&lc=" + allComment[number][0];
    //random.innerText = allComment[number][4];

    random.children[2].remove();
    createCommentElement(random, allComment[number], 2);
}

//document.getElementById("changeRandomCommentButton").onclick = getRandomComment;


function startFileRead() {
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
    isYouTubeAllComment = window.confirm("YAJU&U以外のコメントも表示しますか？");

    /*const analyzeButton = document.getElementById("analyzeButton");
    analyzeButton.innerText = "分析中";
    analyzeButton.style = "background-color: gray; touch-action: none;";*/
    document.getElementById("fileInputWrapper").innerHTML = "読み込み中";

    //選択されたすべてのファイルを読む
    for (let i = 0; i < fileInput.files.length; i++) {
        const file = fileInput.files[i];
        readfile(file, isTakeoutFile);
    }
}


function caculateOldestComment() {
    const el = document.getElementById("oldestComment");
    let oldestDate = 99999999999999;

    allComment.forEach((element, index) => {
        if (element[2] < oldestDate) {
            oldestCommentIndex = index;
            oldestDate = element[2];
        }
    })

    //el.href = "https://www.youtube.com/watch?v=niKAylKNIEI&lc=" + allComment[oldestCommentIndex][0];
    //el.innerText = allComment[oldestCommentIndex][4];
    //createCommentElement(el, allComment[oldestCommentIndex], 2);
}


function caculateCommentAverage() {
    const firstCommentDate = allComment[oldestCommentIndex][2];
    const lastCommentDate = allComment[getNewestCommentIndex()][2];
    let commentCount = 0;

    allComment.forEach((element) => {
        if (firstCommentDate <= element[2] && lastCommentDate >= element[2]) {
            commentCount++;
        }
    })

    //コメントしてから現在（最後にコメントした日）の日数
    const dayLength = Math.round((lastCommentDate.getTime() - firstCommentDate.getTime()) / (1000 * 60 * 60 * 24));
    commentAverage = Math.round((commentCount / dayLength) * 100) / 100;
}


function getNewestCommentIndex() {
    let newestDate = 0;
    let newestCommentIndex;

    allComment.forEach((element, index) => {
        if (element[2] > newestDate) {
            newestCommentIndex = index;
            newestDate = element[2];
        }
    })

    return newestCommentIndex;
}


function createCommentElement(parentElement, array, type) {
    const container = document.createElement("div");
    if (type === 1) {
        container.classList.add("commentContainer");
    } else {
        container.classList.add("commentContainer2");
    }
    const textP = document.createElement("p");
    textP.innerText = array[4];
    textP.style = "color: white; overflow-wrap: break-word; white-space: pre-wrap; word-wrap: break-word;"
    const a = document.createElement("a");
    if (array[3] === "") {
        a.innerText = "コメントに移動";
    } else {
        a.innerText = "返信に移動";
    }
    a.href = "https://www.youtube.com/watch?v=niKAylKNIEI&lc=" + array[0];
    a.target = "_blank";
    a.style = "white-space: nowrap;"
    const about = document.createElement("span");
    //about.innerText = " " + array[2].getFullYear() + "/" + array[2].getMonth() + "/" + array[2].getDate() + " " + array[2].getHours() + ":" + array[2].getMinutes() + ":" + array[2].getSeconds();
    about.innerText = array[2].toLocaleString();
    about.style = "margin: 0 0 0 8px; color: gray; white-space: nowrap;"

    const rowDiv = document.createElement("div");
    rowDiv.style = "word-break: break-word;";

    parentElement.appendChild(container);
    container.appendChild(textP);
    container.appendChild(rowDiv);
    rowDiv.appendChild(a);
    rowDiv.appendChild(about);
}


function timeline() {
    console.log("timeline");

    const el = document.getElementById("timelineCommentWrapper");
    el.innerHTML = "";
    const dateSelectorValue = document.getElementById("timelineDate").value;
    const selectedDate = new Date("2020-1-1T00:00:00");
    selectedDate.setFullYear(dateSelectorValue.substring(0, 4));
    selectedDate.setMonth(dateSelectorValue.substring(5, 7) - 1);
    selectedDate.setDate(dateSelectorValue.substring(8, 10));
    //console.log(timelineValue);

    //選択した日付からのコメントのindexを求める    
    const sort = document.getElementById("timelineSortSelector").value;
    if (sort === "older") {
        timelineNowIndex = 0;
        allComment.forEach((element, index) => {
            if (element[2] <= selectedDate) {
                timelineNowIndex = index + 1;
            }
        })
    } else if (sort === "newer") {
        timelineNowIndex = allComment.length;
        selectedDate.setHours(23);
        selectedDate.setMinutes(59);
        selectedDate.setMilliseconds(999);
        allComment.forEach((element, index) => {
            if (element[2] <= selectedDate) {
                timelineNowIndex = index - 1;
            }
        })
    }

    createTimeline();
}

document.getElementById("timelineSortSelector").addEventListener("change", function () {
    setTimelineDate();
}, false)
function setTimelineDate() {
    const sortSelectorElement = document.getElementById("timelineSortSelector");
    const dateElement = document.getElementById("timelineDate");
    if (sortSelectorElement.value === "older") {
        const date = allComment[oldestCommentIndex][2];
        dateElement.value = date.toISOString().substring(0, 10);
    } else if (sortSelectorElement.value === "newer") {
        const date = allComment[getNewestCommentIndex()][2];
        dateElement.value = date.toISOString().substring(0, 10);
    }

    if (sortSelectorElement.value === "random") {
        dateElement.style.display = "none";
    } else {
        dateElement.style.display = "block";
    }
}

document.getElementById("timeline").addEventListener("change", function (e) {
    timeline();
}, false)


function createTimeline() {
    const el = document.getElementById("timelineCommentWrapper");
    const filter = document.getElementById("timelineFilterSelector").value;
    const sort = document.getElementById("timelineSortSelector").value;

    let index = timelineNowIndex;
    for (let i = timelineNowIndex; i < timelineNowIndex + 50; i++) {
        if (sort === "random") {
            index = getRandomNumber(0, allComment.length);
        }

        if (filter === "comment") {
            if (allComment[index][3] === "") {
                createCommentElement(el, allComment[index], 1);
            }
        } else if (filter === "reply") {
            if (allComment[index][3] !== "") {
                createCommentElement(el, allComment[index], 1);
            }
        } else {
            createCommentElement(el, allComment[index], 1);
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

document.getElementById("timelineMoreButton").onclick = createTimeline;


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

        allComment = JSON.parse(getArray);

        //日付のデータが文字列になっちゃってるから直す
        allComment.forEach((element, index) => {
            allComment[index][2] = new Date(element[2]);
        })

        startAnalyze();
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
    allComment.forEach((element) => {
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
    allComment = result.reverse();

    //日付のデータが文字列になっちゃってるから直す
    allComment.forEach((element, index) => {
        allComment[index][2] = new Date(element[2]);
    })

    startAnalyze();
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