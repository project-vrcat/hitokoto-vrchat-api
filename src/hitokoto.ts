import axios from "axios";

export async function getHitokoto(params: URLSearchParams): Promise<any> {
  const url = new URL("https://international.v1.hitokoto.cn");
  params.forEach((value, key) => url.searchParams.set(key, value));
  url.searchParams.set("encode", "json");
  const resp = await axios.get(url.toString());
  return resp.data;
}
