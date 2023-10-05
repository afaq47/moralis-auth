import { MetaMaskConnector } from "wagmi/connectors/metaMask";
import { CoinbaseWalletConnector } from "wagmi/connectors/coinbaseWallet";
import { WalletConnectConnector } from "wagmi/connectors/walletConnect";
import { signIn } from "next-auth/react";
import { useAccount, useConnect, useSignMessage, useDisconnect } from "wagmi";
import { useRouter } from "next/router";
import { useAuthRequestChallengeEvm } from "@moralisweb3/next";

function SignIn() {
  const { connectAsync } = useConnect();
  const { disconnectAsync } = useDisconnect();
  const { isConnected } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const { requestChallengeAsync } = useAuthRequestChallengeEvm();
  const { push } = useRouter();

  const handleAuth = async (wal) => {
    if (isConnected) {
      await disconnectAsync();
    }

    let connector;
    switch (wal) {
      case "coin":
        connector = new CoinbaseWalletConnector({
          options: {
            appName: process.env.APP_DOMAIN,
          },
        });
        break;
      case "wal":
        connector = new WalletConnectConnector({ options: { qrcode: true } });
        break;

      default:
        connector = new MetaMaskConnector();
        break;
    }
    const { account, chain } = await connectAsync({
      connector,
    });

    const { message } = await requestChallengeAsync({
      address: account,
      chainId: chain.id,
    });

    const signature = await signMessageAsync({ message });

    // redirect user after success authentication to '/user' page
    const { url } = await signIn("moralis-auth", {
      message,
      signature,
      redirect: false,
      callbackUrl: "/user",
    });
    /**
     * instead of using signIn(..., redirect: "/user")
     * we get the url from callback and push it to the router to avoid page refreshing
     */
    push(url);
  };

  return (
    <div>
      <h3>Web3 Authentication</h3>
      <button onClick={() => handleAuth("meta")}>Authenticate via Metamask</button>
      <br />
      <button onClick={() => handleAuth("coin")}>Authenticate via Coinbase</button>
      <br />
      <button onClick={() => handleAuth("wal")}>Authenticate via Wallet Connect</button>
    </div>
  );
}

export default SignIn;
