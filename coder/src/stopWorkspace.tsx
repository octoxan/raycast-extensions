import { Detail, LaunchProps } from "@raycast/api";
import { useEffect, useState } from "react";
import { exec } from "child_process";

interface Arguments {
  workspace: string;
}

export default function main(props: LaunchProps<{ arguments: Arguments }>) {
  const [isLoading, setIsLoading] = useState(true);
  const [output, setOutput] = useState("");
  const { workspace } = props.arguments;

  useEffect(() => {
    const stopWorkspace = async () => {
      try {
        const command = `coder workspaces stop ${workspace}`;
        const output = await executeCommand(command);
        setOutput(output);
      } catch (error) {
        console.error("Error while stopping the workspace:", error);
        setOutput("Error: " + (error as Error).message);
      }
      setIsLoading(false);
    };

    stopWorkspace();
  }, [workspace]);

  const executeCommand = async (command: string) => {
    return new Promise<string>((resolve, reject) => {
      exec(command, (error, stdout, stderr) => {
        if (error) {
          console.error(`Command execution error: ${error.message}`);
          reject(error);
          return;
        }
        console.log(`Command output on stderr: ${stderr}`);

        // Resolve with accumulated stderr data
        resolve(stderr.trim());
      });
    });
  };


  return (
    <Detail
      isLoading={isLoading}
      markdown={output}
    />
  );
}
