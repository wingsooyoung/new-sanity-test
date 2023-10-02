// // sanity.js
// import {createClient} from '@sanity/client'

// const client = createClient({
//   projectId: 'o9bzeud3',
//   dataset: 'production',
//   useCdn: true, // set to `false` to bypass the edge cache
//   apiVersion: '2023-10-01',
// })

// const data = await client.fetch(`count(*)`)
// console.log(`Number of documents: ${data}`)


// // uses GROQ to query content: https://www.sanity.io/docs/groq

// export async function getPosts() {
//   const query = '*[_type == "postcard-1"] {postcardDesign->{postcardBase{caption, "image": asset->url}}, letterTo, letterSigned, letterFrom, letterMessage, _id}'

//    const posts = await client.fetch(query)
//     .then((res) => console.log(res.json()))
//     .then(({ res }) => {
//         // get the list element, and the first item
//         let list = document.querySelector("ul");
//         let firstListItem = document.querySelector("ul li");

//         if (res.length >= 0) {
//         // remove the placeholder content
//         list.removeChild(firstListItem);

//         result.forEach((postcard) => {
//             // create a list element for each pet
//             let listItem1 = document.createElement("li");
//             let listItem2 = document.createElement("li");
//             let listItem3 = document.createElement("li");
//             let listItem4 = document.createElement("li");
//             let listItem5 = document.createElement("li");

//             // add the pet name as the text content
//             listItem1.textContent = postcard?.postcardDesign;
//             listItem2.textContent = postcard?.letterTo;
//             listItem3.textContent = postcard?.letterSigned;
//             listItem4.textContent = postcard?.letterFrom;
//             listItem5.textContent = postcard?.letterMessage;

//             // add the item to the list
//             list.appendChild(listItem1);
//             list.appendChild(listItem2);
//             list.appendChild(listItem3);
//             list.appendChild(listItem4);
//             list.appendChild(listItem5);
//         });
//         // let pre = document.querySelector("pre");
//         // // add the raw data to the preformatted element
//         // pre.textContent = JSON.stringify(result, null, 2);
//         }
//     })
//     .catch((err) => {
//       console.error(err);
//       // let list = document.querySelector("ul");
//       // let firstListItem = document.querySelector("ul li");
//       // firstListItem.textContent = "you reached an error"
//     });
//   return posts
// }


