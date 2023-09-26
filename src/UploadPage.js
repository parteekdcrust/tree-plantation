import React, { useState, useRef } from "react";
import "./UploadPage.css";
import axios from "axios";
import Spinner from './loader';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const Web3 = require("web3");
const contractABI = require("./contractABI.json");//contract abi
const contractAddress = "0x756043a43239C2E4163D37EbBeCE50e284113E80";//contract address 

const UploadPage = () => {
  //
  //setstate variables
  //
  let [formData, setformData] = useState({
    name: "",
    mobileNumber: "",
    email: "",
    walletAddress: "",
  });
  const [walletAdressText, setWalletAddressText] = useState(
    "Click on connect wallet button"
  );
  const [buttonText, setButtonText] = useState("Connect Wallet");
  const [web3, setWeb3] = useState(null);
  const [defaultAcount, setDefaultAccount] = useState(null);
  const [provider, setProvider] = useState(null);
  const [photoUpload, setPhotoUpload] = useState(false);
  const formRef = useRef(null);
  const [Loading,setLoading] = useState(false);
  //
  //Event Handler Functions
  //
  const handleInputChange = (e) => {
    try {
      const { name, value } = e.target;
      setformData({ ...formData, [name]: value });
      return;
    } catch (error) {
      console.log(error);
    }
  };
  //
  //
  const handleConnectWallet = async () => {
    try {
      if (buttonText === "Connect Wallet" && !provider) {
        //setting provider
        const provider = window.ethereum;
        if (!provider) throw new Error("Browser is not Ethereum supported !!");
        setProvider(provider);
        console.log("Current provider : ", provider);
        //initialize web3
        const web3 = new Web3(provider);
        setWeb3(web3);
        console.log(web3);
        //adding spinner
        setLoading(true);
        //getting user accounts
        const accounts = await window.ethereum.request({
          method: "eth_requestAccounts",
        });

        // const accounts = await web3.eth.getAccounts();
        if (accounts.length === 0){
          toast.error("Add Accounts to Metamask Wallet !")
          throw new Error("Add Accounts to Metamask Wallet");
        }
          
        console.log(accounts);
        toast.success("Account Fetched ",{autoClose:2000})
        setLoading(false);
        setWalletAddressText(accounts[0]);
        formData.walletAddress = accounts[0];

        setButtonText("Disconnect Wallet");
        setDefaultAccount(accounts[0].toString());
      } else if (buttonText === "Disconnect Wallet") {
        //setting provider to null
        setProvider(null);
        setDefaultAccount(null);
        toast.warn("MetaMask Disconnected !")
        setWalletAddressText("Click on connect wallet button");
        setButtonText("Connect Wallet");
        console.log("Disconnected");
      }
    } catch (error) {
      console.log(error);
    }
  };
  //
  //
  const getCurrentPosition = () => {
    try {
      return new Promise((resolve, reject) => {
        if ("geolocation" in navigator) {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              resolve(position);
            },
            (error) => {
              reject(error);
            }
          );
        } else {
          reject(new Error("Geolocation is not available in this browser."));
        }
      });
    } catch (error) {
      console.log(error);
    }
  };
  //
  //
  const handleFileDrop = async (event) => {
    formData = { ...formData, photo: event.target.files[0] };
    console.log(event.target.files);
    const date = new Date();
    console.log("Date of upload: ", date.toLocaleDateString());
    console.log("Time of upload: ", date.toLocaleTimeString());
    setLoading(true);
    const position = await toast.promise(getCurrentPosition(),{
      pending: 'Fetching User Location',
      success: 'Location Fetched ',
      error: 'Error in fetching Location '
    });
    const latitude = position.coords.latitude;
    const longitude = position.coords.longitude;
    console.log("Location: ", [latitude, longitude]);
    try {
      const response = await toast.promise(axios.post(
        "http://localhost:5000/upload",
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      ),{
        pending:"Uploading File",
        success:"File Uploaded ",
        error:"Error in uploading file"
      })
      console.log(response.data);
      if (response.data.photoPath) setPhotoUpload(true);
      setLoading(false);
      return;
    } catch (error) {
      console.log(error);
    }
  };
  //
  //
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (!photoUpload) {
        toast.warn("Please Upload photo");
        throw new Error("Please Upload photo first");
      }
      if(!defaultAcount) {
        toast.warn("No wallet account found !");
        throw new Error("No wallet account found !");
      }
      console.log("We get it ");
      const kissanContract = await new web3.eth.Contract(
        contractABI,
        contractAddress
      );
      console.log(kissanContract);
      //
      // Read function from  contract
      //total supply of token
      //
      const totalSupply = await kissanContract.methods.totalSupply_().call();
      console.log("total supply: ", web3.utils.fromWei(totalSupply, "ether"));
      //
      //balance of user account
      //
      let balance = await kissanContract.methods
        .balanceOf(defaultAcount)
        .call();
      console.log("balance: ", web3.utils.fromWei(balance, "ether"));
      //
      // write function to contract
      //transferring ksn token to user account
      //
      const trans = await toast.promise(kissanContract.methods
        .mint(web3.utils.BN(web3.utils.toWei("200", "ether").toString()))
        .send({
          from: defaultAcount,
        }),{
          pending:"Sending Transaction",
          success:"Transaction Succesfull ",
          error:"Error in Transaction"
        });
      console.log(trans);
      //
      //updated balance of user
      //
      balance = await kissanContract.methods.balanceOf(defaultAcount).call();
      toast.info(`Your Balance : ${web3.utils.fromWei(balance, "ether")} KSN` );
      console.log("balance: ", web3.utils.fromWei(balance, "ether"));

      formRef.current.reset();
      setPhotoUpload(null);
        setLoading(false);
    } catch (error) {
      formRef.current.reset();
      setPhotoUpload(null);
      setLoading(false);
      toast.error("Error Occurred");
      console.log(error);
    }
  };
  //
  //
  //
  //
  return (
    <div className="upload-page" id="main">
      <div className="leftpanel" id="leftPanel">
        <img className="icon" alt="" src="/21439018-6432897-1@2x.png" />
      </div>
      <div className="rightpanel" id="rightPanel">
        <div className="detailsframe" id="detail">
          <h1 className="upload-selfie-and-container" id="details-heading">
            <span className="upload-selfie-and-container1">
              <span>
                <span className="upload-selfie-and">
                  Upload Selfie and Get FREE
                </span>
                <b>&nbsp;</b>
              </span>
              <span className="ksn">KSN</span>
              <span>
                <b>&nbsp;</b>
                <span className="upload-selfie-and">!</span>
              </span>
            </span>
          </h1>
          {Loading && <Spinner />}
          <form ref={formRef} className="details" id="detailContent">
            <div className="name">
              <label htmlFor="fullname">Full Name</label>
              <input
                type="text"
                id="fullname"
                name="name"
                placeholder="Enter your full name"
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="email-address">
              <label htmlFor="email">Email Address</label>
              <input
                type="email"
                id="email"
                name="email"
                placeholder="Enter your email address"
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="mobile-number">
              <label htmlFor="mobile">Mobile Number</label>
              <input
                type="text"
                id="mobile"
                name="mobileNumber"
                placeholder="Enter your mobile number"
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="wallet-address">
              <label htmlFor="address">Wallet Address</label>

              <input
                type="text"
                id="address"
                name="Wallet Address"
                placeholder={walletAdressText}
                disabled
                
              />
              <button
                className="connectbutton btn btn-primary"
                type="button"
                onClick={handleConnectWallet}
              >
                {buttonText}
              </button>
            </div>
            <label htmlFor="upload selfie">Upload Selfie</label>
            <input
              className="uploadselfiebutton"
              type="file"
              name="photo"
              onChange={handleFileDrop}
            />

            <button
              className="submitbutton btn btn-primary"
              type="button"
              onClick={handleSubmit}
            >
              Get Free KSN
            </button>
          </form>
        </div>
      </div>
      <ToastContainer position="top-center"/>
    </div>
  );
};

export default UploadPage;
