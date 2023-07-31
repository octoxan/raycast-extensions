import { Detail, getPreferenceValues, confirmAlert, showToast, Toast } from "@raycast/api";
import fetch from "node-fetch";
import { exec } from "child_process";

export interface Preferences {
  coderAPIKey: string;
  coderUserID: string;
  coderUserName: string;
}

export default async function Command() {
  const preferences = getPreferenceValues<Preferences>();
  const apiKey = preferences.coderAPIKey;
  const userId = preferences.coderUserID;

  const runSSHRebuild = () => {
    const command = "coder config-ssh";

    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error executing command: ${error.message}`);
        return;
      }

      if (stderr) {
        console.error(`Command execution stderr: ${stderr}`);
        return;
      }

      console.log(`Command executed successfully: ${stdout}`);
    });
  };

    try {
        await runSSHRebuild();
        showToast({ title: "Rebuild SSH Config", message: "SSH config has been rebuilt with new workspaces.", style: Toast.Style.Success });
    } catch (error) {
        showToast({ title: "Rebuild SSH Config", message: "Failed to rebuild SSH config!", style: Toast.Style.Failure });
    }
}