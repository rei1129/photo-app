import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { RootState } from '../../app/store';
import axios from 'axios';
import {PROPS_AUTHEN, PROPS_PROFILE, PROPS_NICKNAME} from '../types'

const apiUrl = process.env.REACT_APP_DEV_API_URL;


// 非同期の関数はsliceの外に書かなければいけない

// ログイン
export const fetchAsyncLogin = createAsyncThunk(
  "auth/post", //アクション名
  async (authen: PROPS_AUTHEN) => { //引数authenに形を割り当てている
    const res = await axios.post(`${apiUrl}authen/jwt/create`, authen, {
      //第一引数はaxiosでアクセスするURLのパス
      //POSTメソッドでアクセスしている
      headers: {
        "Content-Type": "application/json",
        //POSTの場合は上記の記述が必要
      },
    });
    return res.data; //アクセストークンをreturn 
  }
);

// 新規ユーザー登録
export const fetchAsyncRegister = createAsyncThunk(
  "auth/register",
  async (auth: PROPS_AUTHEN) => {
    const res = await axios.post(`${apiUrl}api/register/`, auth, {
      headers: {
        "Content-Type": "application/json",
      },
    });
    return res.data;
  }
);

// プロフィールを新規作成
export const fetchAsyncCreateProf = createAsyncThunk(
  "profile/post",
  async (nickName: PROPS_NICKNAME) => {
    const res = await axios.post(`${apiUrl}api/profile/`, nickName, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `JWT ${localStorage.localJWT}`,
        // ログインしていないと見れないページなので上記を記述
      },
    });
    return res.data;
  }
);

// プロフィールを更新
export const fetchAsyncUpdateProf = createAsyncThunk(
  "profile/put",
  async (profile: PROPS_PROFILE) => {
    const uploadData = new FormData();

    // uploadDataに　append メソッドを利用することで属性を追加できる
    uploadData.append("nickName", profile.nickName);
    
    profile.img && uploadData.append("img", profile.img, profile.img.name);
    // imgが存在する場合のみ　appendで追加する

    const res = await axios.put(
      //更新なのでPUTメソッド
      `${apiUrl}api/profile/${profile.id}/`,
      uploadData,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `JWT ${localStorage.localJWT}`,
        },
      }
    );
    return res.data;
  }
);

// ログインしているユーザー自身のプロフィールを取得する
export const fetchAsyncGetMyProf = createAsyncThunk("profile/get", async () => {
  const res = await axios.get(`${apiUrl}api/myprofile/`, {
    headers: {
      Authorization: `JWT ${localStorage.localJWT}`,
    },
  });
  return res.data[0]; //filterで得られるのはオブジェクトが一つであっても
  //配列で渡されてしまうので[0]を指定
});

// 存在するプロフィールの全てを取得する
export const fetchAsyncGetProfs = createAsyncThunk("profiles/get", async () => {
  const res = await axios.get(`${apiUrl}api/profile/`, {
    headers: {
      Authorization: `JWT ${localStorage.localJWT}`,
    },
  });
  return res.data;
});


export const authSlice = createSlice({
  name: 'auth',
  initialState: {
    openSignIn: true, //ログイン用のモーダルを起動するかどうか
    openSignUp: false, //サインアップ用のモーダルを起動するかどうか
    openProfile: false, //プロフィールのモーダル制御
    isLoadingAuth: false, //APIにアクセスして処理をしている最中にtrueになる
    myprofile: {
      id: 0,
      nickName: "",
      userProfile: 0,
      created_on: "",
      img: "",
    },
    profiles: [
    // 全てのプロフィールを格納している
      {
        id: 0,
        nickName: "",
        userProfile: 0,
        created_on: "",
        img: "",
      },
    ], 
  },
  reducers: {
    fetchCredStart(state){ //APIに接続した時に呼び出される
      state.isLoadingAuth = true;
    },
    fetchCredEnd(state){ //APIに接続が完了した際に呼び出される
      state.isLoadingAuth = false;
    },
    setOpenSignIn(state) { //ログインのモーダルを表示
      state.openSignIn = true;
    },
    resetOpenSignIn(state) { //ログインのモーダルを非表示
      state.openSignIn = false;
    },

    setOpenSignUp(state) { //サインアップのモーダルを表示
      state.openSignUp = true;
    },
    resetOpenSignUp(state) { //サインアップのモーダルを非表示
      state.openSignUp = false;
    },
    setOpenProfile(state) { //プロフィールの編集用のモーダルを表示
      state.openProfile = true;
    },
    resetOpenProfile(state) { //プロフィールの編集用のモーダルを非表示
      state.openProfile = false;
    },
    editNickname(state, action){ //プロフィールのnicknameを編集するためのアクション
      state.myprofile.nickName = action.payload;
    },
  },


  extraReducers: (builder) => {
    //loginがfulfilled(成功)した時の処理
    builder.addCase(fetchAsyncLogin.fulfilled, (state, action) => {
      localStorage.setItem("localJWT", action.payload.access);
      // ローカルストレージにJWTのトークンを保存する　JWTには「refresh」と「access」があり今回はaccessを使用するため.access
    });

    // プロフィールの作成が成功した時
    builder.addCase(fetchAsyncCreateProf.fulfilled, (state, action) => {
      state.myprofile = action.payload;
    });

    // ログインユーザーの情報を取得できた時
    builder.addCase(fetchAsyncGetMyProf.fulfilled, (state, action) => {
      state.myprofile = action.payload;
    });

    //プロフィールの全一覧を取得できた時
    builder.addCase(fetchAsyncGetProfs.fulfilled, (state, action) => {
      state.profiles = action.payload;
    });

    // プロフィールの更新が成功した時
    builder.addCase(fetchAsyncUpdateProf.fulfilled, (state, action) => {
      state.myprofile = action.payload;
      state.profiles = state.profiles.map((prof) =>
        prof.id === action.payload.id ? action.payload : prof
      );
    });

  },

});

export const {
  fetchCredStart,
  fetchCredEnd,
  setOpenSignIn,
  resetOpenSignIn,
  setOpenSignUp,
  resetOpenSignUp,
  setOpenProfile,
  resetOpenProfile,
  editNickname,
} = authSlice.actions;

export const selectIsLoadingAuth = (state: RootState) =>
  state.auth.isLoadingAuth;
  //ここでいうauthはstateの名前

export const selectOpenSignIn = (state: RootState) => state.auth.openSignIn;
export const selectOpenSignUp = (state: RootState) => state.auth.openSignUp;
export const selectOpenProfile = (state: RootState) => state.auth.openProfile;
export const selectProfile = (state: RootState) => state.auth.myprofile;
export const selectProfiles = (state: RootState) => state.auth.profiles;


export default authSlice.reducer;
