    const express = require('express');
    const app = express()
    // const port = 5000
    const dotenv = require('dotenv');
    const bcrypt = require('bcrypt')

//순서 중요!
    const session = require('express-session');
    const passport = require('passport');
    const LocalStrategy = require('passport-local');
    const MongoStore = require('connect-mongo')
    dotenv.config()

    app.use(passport.initialize());
    app.use(session({
        secret : '암호화에쓸비번', //세션 문서의 암호화
        resave: false, //유저가 서버로 요청할 떄마다 갱싱한걸지
        saveUninitialized: false, //로그인 안해도 세션 만들건지
        // 일정 시간이 지났을때 자동로그인 되게 할 수 있음 60* 60 * 1000 = 1시간
        cookie: {maxAge: 60* 60 * 1000},
        store : MongoStore.create({
            mongoUrl : `mongodb+srv://${process.env.MONGODB_ID}:${process.env.MONGODB_PW}@cluster0.dcnxjtw.mongodb.net/`,
            dbName: "board"
        })
    }))

    
    app.use(passport.session());



 
    app.use(express.json())
    app.use(express.urlencoded({ extended: true }))
    // 기본폴더 public으로 설정
    app.use(express.static(__dirname + '/public'))
    //포트번호 입력 포트 여는방식
    // app.listen(5000, ()=>{
    //     console.log("5000포트 서버 실행")
    // })

    const methodOverride = require('method-override');
    app.use(methodOverride('_method'));

    app.set('view engine', 'ejs');

    const { MongoClient, ObjectId } = require('mongodb');

    let db;
    // 샘플데이터 
    let sample;
    const url = `mongodb+srv://${process.env.MONGODB_ID}:${process.env.MONGODB_PW}@cluster0.dcnxjtw.mongodb.net/`

    //url연결.성공했다면
    new MongoClient(url).connect().then((client) => {
        db = client.db("board");
        // 몽고디비에 있는 데이터
        sample = client.db("sample_training")
        console.log("DB 연결 완료!")
        // db연결될 때 서버 열림
        app.listen(process.env.SERVER_PORT, () => {
            console.log(`${process.env.SERVER_PORT}번호에서 서버 실행 중`)
        })
    }).catch((error) => {
        console.log(error)
    })





    //웹페이지를 어떤경로로 할건지 설정하는 과정 /로 접속했다면 이란 뜻이고 get에서는 파라미터를 request response
    app.get('/', (req, res) => {
        // 응답
        // res.send("Hello World");
        // page파일에 index.html을 나타내겠다~
        res.sendFile(__dirname + '/page/index.html')
    })
    // 다른 주소 예를들어 about으로 가고싶음 서버 js에서 무언가를 수정하면 반응이 없을거임ㅇㅇ 
    // server.js에서 무언가 바꿔주면 항상 서버를 껐다가 켜줘야함 컨트롤 c yarn start로 서버 다시 열어줘야함  router기능을 쭉 만들어주는거
    app.get('/about', (req, res) => {
        // 응답
        res.send("어바웃 페이지");
        // res.sendFile(__dirname + '/page/about.html')
        // db.collection("notice").insertOne({
        //     title: "첫번째 글",
        //     content: "두번째 글"
        // })


    })

    // await(또는 then):잠시 멈춰주는기능 완료가 되면 코드 실행 const result 지금은 데이터가 별로 없어서 바로 뜨지만..  밑에 코드가 오억개라 생각해보셈... 접속했는데 뒤에 코드는 아직 덜 가져왔는데 이미 접속했고 ㄷㄷㄷ 호달달... 그래서 뒤에코드를 바로 가져오지 말고 위에 접속이 끝날때까지 기다려 주다가 뒤에 문서를 가져와주셈...  
    app.get('/list', async (req, res) => {
        // find() 전체 문서를 배열로 가져오기 /  findOne() 하나만 가져오기 너 완전 백엔드
        // 페이지네이션
        const result = await db.collection("notice").find().limit(5).toArray()
        // console.log(result[0])
        // ejs파일을 랜더링 하겠다 라는 뜻 너 완전 프론트엔드
        res.render('list.ejs', {
            // title : "abcd",
            // name : "pes"
            data: result
            // props데이터를 받는 방법 list.ejs

        })
    })
    // :id는 작명 가능하고 :쓰면 
    app.get('/list/:id', async (req, res) => {
    
        // 페이지네이션 limit(5) skip(6) 첫 게시글 12345의 게시글 skip(0) id가 2이면 
        const result = await db.collection("notice").find().skip((req.params.id-1)*5).limit(5).toArray()
        // console.log(result[0])
        // ejs파일을 랜더링 하겠다 라는 뜻 너 완전 프론트엔드
        res.render('list.ejs', {
            // title : "abcd",
            // name : "pes"
            data: result
            // props데이터를 받는 방법 list.ejs

        })
    })
    // :id 부분 작명 RESTful 직.관.적으로 쓸것
    app.get('/view/:id', async (req, res) => {
        const result = await db.collection("notice").findOne({
            _id: new ObjectId(req.params.id)
        })
        res.render('view.ejs', {
            data: result


        })

    })

    app.get('/write', (req, res) => {
        res.render('write.ejs');
    })
    // 라우터 설정 해준것 add
    app.post('/add', async (req, res) => {
        // console.log(req.body)
        // res.render('add.ejs')
        try {
            // 데이터 넣는 코드
            await db.collection("notice").insertOne({
                title: req.body.title,
                content: req.body.content

            })
        } catch (error) {
            console.log(error)
        }
        // res.send("성공!") 성공! 하는 페이지 나옴
        // list 페이지로 가고싶다면 redirect로 연결 send랑 redirect는 동시에 못씀
        res.redirect('/list')
    })



    app.put('/edit', async (req, res) => {
        //     updateOne({문서},{
        //        $set : {원하는 키 : 변경값}
        //    })
        //    업데이트를 1개만 하겠다
        // console.log(req.body)
        await db.collection("notice").updateOne({
            _id: new ObjectId(req.body._id)
        }, {
            $set: {
                title: req.body.title,
                content: req.body.content
            }
        })
        const result = "";
        res.redirect('/list')
    })


    // app.get('/delete/:id', async (req, res) => {
    //     const result = await db.collection("notice").deleteOne({
    //         _id: new ObjectId(req.params.id)
    //     })
    //     res.render('delete.ejs', {
    //         data: result
    //     })
    // })


    // // 삭제 누르고 나서 list로 가줌
    // app.delete('/delete', async (req, res) => {
    //     await db.collection("notice").deleteOne({
    //         _id: new ObjectId(req.body.id)
    //     });
        
    //     res.redirect('/list');
    // });

    
    app.get('/delete/:id', async (req, res) => {
        await db.collection("notice").deleteOne({
           _id: new ObjectId(req.params.id)
       })
       res.redirect('/list');
       })
   
    //내가쓴 아이디,비번 도중에 무언가 실행하는 코드
    passport.use(new LocalStrategy({
        usernameField : 'userid',
        passwordField : 'password'
    },async (userid , password, cb)=>{
        let result = await db.collection("users").findOne({
            userid : userid
        })
        // 정보가 일치하지 않거나 없다면
        if(!result){
            // null은 기본값 false는 인증하지 않겠다. cb 미들웨어 도중에 실행하는것 req res의 권한을 가지는 함수 
            return cb(null, false, {message: '아이디나 비밀번호가 일치 하지 않음'})
        }
        const passChk = await bcrypt.compare(password, result.password);
        console.log(passChk)
        if(passChk){
            return cb(null, result);

        }else{
            return cb(null, false, {message: "아이디나 비밀번호가 일치하지 않음"})
        }

        // if(result.password === password){
        //     return cb(null, result);
        // }else{
        //     return cb(null, false, {message: '아이디나 비밀번호가 일치 하지 않음'})
        // }
    }))
    // serializeUser 이 코드의 하단에서만 동작하기 때문에 상단에 코드를 해주는게 좋음 인코딩
    passport.serializeUser((user,done)=>{
        //비동기처리 nextTick
        process.nextTick(()=>{
            //done(null, 세션에 기록할 내용)
            done(null,{id: user._id , userid: user.userid})
        })
    })


    // 
    passport.deserializeUser(async (user,done)=>{
        let result = await db.collection("users").findOne({
            // collection에 있는 id값을 다시 저장한다(?)
            _id: new ObjectId(user.id)
        })
        delete result.password
        // console.log(result)
        process.nextTick(()=>{
            done(null,result)
        })
    })

    //아이디 비번치고 눌렀을때
    app.get('/login', (req,res)=>{
        res.render("login.ejs")
    })
    //->아이디 비번을 받을곳이 필요쓰 
    app.post('/login', async(req,res, next)=>{
        // console.log(req.body)
        //  아이디 비번 받을때사용 error,user,info 국룰로 받는ㅇㅇ 
        passport.authenticate('local' , (error,user, info)=>{
            console.log(error,user, info);
            // error일때 500에러(서버에러)를 받고 json형태로 나타낸다
            if(error) return res.status(500).json(error)
            // 유저정보가 없을때 info는 실패했을때 user가 성공했을 때 데이터
            if(!user)  return res.status(401).json(info.message)
            req.logIn(user, (error)=>{
               if(error) return next(error);
               res.redirect('/')

            })
        })(req,res,next)
    })


    app.get('/register', (req,res)=>{
        res.render("register.ejs")
    })

    app.post('/register', async (req,res)=>{
        // 뒤에 숫자를 설정하면 이걸 몇번 꼬아낼거냐~ 근데 숫자가 너무 길면은 ㄴㄴ 국룰로 10
        let hashPass = await bcrypt.hash(req.body.password, 10);
        // console.log(hashPass)
        try {
            // 데이터 넣는 코드 insertOne~~ 
            await db.collection("users").insertOne({
                userid: req.body.userid,
                password: hashPass

            })
            //  await db.collection("users").insertOne(req.body) <-데이터를 정확하게 넣어주기 위해서 따로 따로 넣어주는것
        } catch (error) {
            console.log(error)
        }
        res.redirect('/list');
    })
    

    // app.delete('/delete', async (req, res) => {
    //      await db.collection("notice").deleteOne({
    //         _id: new ObjectId(req.body._id)
    //     })
    //     res.redirect('/list');
    //     })
    




// app.get('/es', (req, res) => {
//     // 이 결과 값을 보낸다~ 하는 의미임 response
//     res.send("es페이지");
// })

