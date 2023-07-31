import { Detail, LaunchProps } from "@raycast/api";
import { useEffect, useState } from "react";
import { spawn } from "child_process";

interface Arguments {
  workspace: string;
}

export default function main(props: LaunchProps<{ arguments: Arguments }>) {
  const [isLoading, setIsLoading] = useState(true);
  const [output, setOutput] = useState("");
  const { workspace } = props.arguments;

  useEffect(() => {
    const startWorkspace = async () => {
      try {
        const command = `coder workspaces rebuild ${workspace} --follow`;
        await executeCommand(command);
      } catch (error) {
        console.error("Error while starting the workspace:", error);
        setOutput("Error: " + error.message);
      }
      setIsLoading(false);
    };

    startWorkspace();
  }, [workspace]);

  const executeCommand = async (command: string) => {
    return new Promise<void>((resolve, reject) => {
      const cmd = spawn(command, { shell: true });

      let outputData = "";
      let errorData = "";

      cmd.stdout.on("data", (data) => {
        const outputChunk = data.toString();
        outputData += outputChunk;
        setOutput(outputData);
      });

      cmd.stderr.on("data", (data) => {
        const errorChunk = data.toString();
        errorData += errorChunk;
        console.error(`Command execution error: ${errorChunk}`);
        reject(new Error(`Command execution failed: ${errorChunk}`));
      });

      cmd.on("close", (code) => {
        console.log(`Command executed successfully with code ${code}`);
        resolve();
      });
    });
  };

  return (
    <Detail
      isLoading={isLoading}
      markdown={output ? "```" + output + "```" : ""}
    />
  );
}
