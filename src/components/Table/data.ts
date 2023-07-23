export const columns = [
    {
        field:'eee',
        width:200,
        fixed:'left',
        align:'right',
        titleAlign:"right"
    },
    {
        field:'ddd',
        width:100,
        fixed:'left',
        align:'left'
    },
    {
        field: 'Date',
        titleAlign:"center",
        children: [
            {
                field: "s",
                titleAlign:"center",
                children: [
                    {
                        field: "p",
                        width: 100
                    }, {
                        field: 'o',
                        width: 200,
                        titleAlign:"center",
                        align:'center'
                    }
                ]
            },
            {
                field: "k",
                titleAlign:"center",
                children: [
                    {
                        field: "g",
                        width: 100,
                        titleAlign:"center",
                        children: [
                            {
                                field: "a",
                                width: 100
                            }, {
                                field: 'b',
                                titleAlign:"center",
                                children: [
                                    {
                                        field: "c",
                                        titleAlign:"center",
                                        children: [
                                            {
                                                field: "y",
                                                width: 100
                                            }, {
                                                field: 't',
                                                width: 200
                                            }
                                        ]

                                    }, {
                                        field: 'd',
                                        width: 200
                                    }
                                ]
                            }
                        ]
                    }, {
                        field: "q",
                        titleAlign:"center",
                        children: [
                            {
                                field: "h",
                                width: 100
                            }, {
                                field: 'n',
                                width: 200
                            }
                        ]
                    }
                ]
            }
        ]
    },
    {
        field: 'Delivery Info',
        titleAlign:"center",
        children: [
            {
                field: 'Name',
                width: 100,
            },
            {
                field: "Addres Info",
                titleAlign:"center",
                children: [

                    {
                        field: 'City',
                        width: 100,
                    }, {
                        field: "State",
                        height: 100,
                        titleAlign:"center",
                        children: [
                             {
                                        field: "age",
                                        width: 100,
                                    },
                                    {
                                        field: 'sex',
                                        width: 100,
                                    }
                        ]
                    }, {
                        field: 'Address',
                        width: 100,
                    }, {
                        field: 'Zip',
                        width: 100,
                    }
                ]
            }

        ]
    },{
        field:"jk",
        width:100
    },{
        field:"rt",
        width:100
    },{
        field:"gh",
        width:100
    },{
        field:"df",
        width:100
    },{
        field:"sa",
        width:100,
        fixed:'right'
    },{
        field:"cv",
        width:100,
        fixed:'right'
    }]
const tableData: any[] = []
for (let i = 0; i < 50; i++) {
    tableData.push(createData(i))
}

function createData(index: number) {
    let obj = Object.create(null)
    const template = ['ddd','eee','p', 'o', 'a', 'y', 't', 'd', 'h', 'n', 'Name', 'City', 'age', 'sex', 'Address', 'Zip','jk','rt','gh','df','sa','cv']
    template.forEach(str => {

        obj[str] = ' '+str + '_' + index

    })
    return obj
}
tableData[3].eee = {
    value:1221,
    isShowChart:true,
    color:"red",
    isBold:true
}
tableData[3].children = [createData(1001),createData(1002),createData(1003)]
export const topData = [createData(100),createData(101),createData(102)]

export const footerData = [createData(1100),createData(1101),createData(1102)]

export default tableData
