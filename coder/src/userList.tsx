import { useState, useEffect } from "react";
import { ActionPanel, Action, Color, Icon, List, getPreferenceValues } from "@raycast/api";
import { useFetch, Response } from "@raycast/utils";
import { filter } from "lodash";
import fetch from "node-fetch";

export interface Preferences {
  coderAPIKey: string;
  coderUserID: string;
  coderUserName: string;
}

export default function Command() {
  const [searchText, setSearchText] = useState("");
  const [users, setUsers] = useState<SearchResult[]>([]);

  const preferences = getPreferenceValues<Preferences>();
  const apiKey = preferences.coderAPIKey;

  // Define a rainbow color scale
  const rainbowColors = [
    Color.Blue,
    Color.Green,
    Color.Yellow,
    Color.Orange,
    Color.Red,
    Color.Magenta,
    Color.Purple,
  ];

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await fetch("https://embold.dev/api/v0/users", {
          headers: {
            "Session-Token": apiKey,
          },
        });

        if (!response.ok) {
          console.error("Failed to fetch users.");
          return;
        }

        const data = (await response.json()) as any[];

        // Assuming the data you provided is an array of user objects
        const users = data.map((user: any) => ({
          id: user.id,
          username: user.username,
          // Add the rest of the properties here based on the interface above
          // For example: image_id: user.image_id, image_tag: user.image_tag, etc.
        })) as SearchResult[];

        setUsers(users);
      } catch (error) {
        console.error("Error while fetching users:", error);
      }
    };

    fetchUsers();
  }, [apiKey]);

  // Filter the data based on the searchText
  const filteredData = searchText
    ? filter(users, (user) => user.username.includes(searchText))
    : users;

  return (
    <List
      isLoading={!users.length}
      onSearchTextChange={setSearchText}
      searchBarPlaceholder="Search users.."
      throttle
    >
      <List.Section title="Users" subtitle={filteredData?.length + ""}>
        {filteredData?.map((searchResult, index) => (
          <SearchListItem
            key={searchResult.username}
            searchResult={searchResult}
            color={rainbowColors[index % rainbowColors.length]}
          />
        ))}
      </List.Section>
    </List>
  );
}

function SearchListItem({ searchResult, color }: { searchResult: SearchResult, color: Color }) {
  return (
    <List.Item
      title={searchResult.username}
      subtitle={searchResult.id}
      icon={{ source: Icon.Person, tintColor: color }}
      actions={
        <ActionPanel>
          <ActionPanel.Section>
            <Action.CopyToClipboard content={searchResult.id} />
          </ActionPanel.Section>
        </ActionPanel>
      }
    />
  );
}

async function parseFetchResponse(response: Response) {
  if (!response.ok) {
    throw new Error(response.statusText);
  }

  const json = await response.json();

  // Assuming the data you provided is an array of user objects
  return json.map((user: any) => ({
    id: user.id,
    username: user.username,
    // Add the rest of the properties here based on the interface above
    // For example: image_id: user.image_id, image_tag: user.image_tag, etc.
  })) as SearchResult[];
}

interface SearchResult {
  id: string;
  username: string;
}
