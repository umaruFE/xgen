function to(t,n){return t.then(function(t){return[null,t]}).catch(function(t){return n&&Object.assign(t,n),[t,void 0]})}export{to as t};
