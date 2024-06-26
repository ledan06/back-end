const Product = require("../../models/product.model");

const systemConfig = require("../../config/system")

const filterStatusHelpers = require("../../helpers/filterStatus")
const searchHelpers = require("../../helpers/search")
const paginationHelpers = require("../../helpers/pagination")


//[GET] /admin/products
module.exports.index = async(req, res) => {
    // console.log(req.query.status);
    
    const filterStatus = filterStatusHelpers(req.query);
    const objectSearch = searchHelpers(req.query);

    let find = {
        deleted: false
    };

    //Status
    if(req.query.status){
        find.status = req.query.status
    };

    //Search
    
    if(objectSearch.regex){
        find.title = objectSearch.regex
    };
    

    //Pagination
    const countProducts = await Product.countDocuments(find);
    let objectPagination = paginationHelpers (
        {
        currentPage: 1,
        limitItems: 4
        },
        req.query,
        countProducts
);

    
    const products = await Product.find(find)
    .sort({position: "desc"})//sắp xếp sản phẩm
    .limit(objectPagination.limitItems)
    .skip(objectPagination.skip);

    // console.log(products)

    res.render("admin/pages/products/index", {
        pageTitle: "Trang sản phẩm",
        products: products,
        filterStatus: filterStatus,
        keyword: objectSearch.keyword,
        pagination: objectPagination
    });
}

//[Patch] /admin/products/change-status/:status/:id
module.exports.changeStatus = async(req, res) => {
    const status = req.params.status
    const id = req.params.id;
    
    await Product.updateOne({ _id: id }, { status: status });
    //updateOne là hàm của mongoos để update 1 sản phẩm

    req.flash("success", "Cập nhật trạng thái thành công!")
    res.redirect("back");
}

//[PATCH] /admin/products/change-/change-multi
module.exports.changeMulti = async (req, res) => {
    const type = req.body.type;
    const ids = req.body.ids.split(", ");
 
    switch (type) {
     case "active":
         await Product.updateMany({ _id: { $in: ids} }, { status: "active"});
         req.flash("success", "Cập nhật trạng thái thành công!")
         break;
     case "inactive":
         await Product.updateMany({ _id: { $in: ids} }, { status: "inactive"}); 
         req.flash("success", "Cập nhật trạng thái thành công!")
         break;
    case "delete-all":
        await Product.updateMany({ _id: { $in: ids} }, {
            deleted: true,
            deletedAt: new Date()
        }); 
        req.flash("success", " Đã xóa thành công!")
        break;
    case "change-position":
        for (const item of ids) {
            
            let [id, position] = item.split("-")
            position = parseInt(position)
            await Product.updateOne({ _id: id }, {
                position: position 
            });
            req.flash("success", "Cập nhật vị trí thành công!")
            // req.flash("success", `Đã đổi vị trí thành công ${ids.length} sản phẩm!`)
        }
        break;
     default:
         break;
    }
    res.redirect("back");
 }

 //[DELETE] /admin/product/delete/id
 module.exports.deleteItems = async (req, res) => {
    const id = req.params.id;
    await Product.updateOne({ _id: id }, {
        deleted: true,
        deletedAt: new Date()
    });
    req.flash("success", "Đã xóa thành công!")
    res.redirect("back");
}

//[GET] /admin/products/create
module.exports.create = async(req,res) => {
    res.render("admin/pages/products/create", {
        pageTitle: "Tạo sản phẩm mới",
    })
}

//[POST] /admin/products/create
module.exports.createPost = async(req,res) => {

    req.body.price = parseInt(req.body.price);
    req.body.stock = parseInt(req.body.stock);
    req.body.discountPercentage = parseInt(req.body.discountPercentage);
    
    if(req.body.position == ""){
        const countProducts = await Product.countDocuments();
        req.body.position = countProducts + 1; 
    }
    
    else{
        req.body.position = parseInt(req.body.position);
    }
    if(req.file){
        req.body.thumbnail = `/uploads/${req.file.filename}`;
    }

    const product = new Product(req.body);
    await product.save();

    res.redirect(`${systemConfig.prefixAdmin}/products`)
}

//[GET] /admin/products/edit/:id
module.exports.edit = async (req, res) => {
    try {
        const find = {
            deleted: false,
            _id: req.params.id
        };
    
        const product = await Product.findOne(find);
    
        res.render("admin/pages/products/edit", {
            pageTitle: "Chỉnh sửa sản phẩm",
            product: product
        });
    } catch (error) {      
        req.flash("error", `Sản phẩm không tồn tại`); 
        res.redirect(`${systemConfig.prefixAdmin}/products`)
        
    }
    
}

//[PATCH] /admin/products/edit/:id
module.exports.editPatch = async (req, res) => {
    const id = req.params.id;

    req.body.price = parseInt(req.body.price)
    req.body.discountPercentage = parseInt(req.body.discountPercentage)
    req.body.stock = parseInt(req.body.stock)
    req.body.position = parseInt(req.body.position)


    if(req.file){
        req.body.thumbnail = `/uploads/${req.file.filename}`;
    }
    try {
        await Product.updateOne({ _id: id }, req.body )
        req.flash("success", `Cập nhật thành công`);
    } catch (error) {
        req.flash("error", `Cập nhật thất bại`);
    }
    res.redirect(`back`)
}


//[GET] /admin/products/detail/:id
module.exports.detail = async (req, res) => {
    try {
        const find = {
            deleted: false,
            _id: req.params.id
        };
    
        const product = await Product.findOne(find);

        res.render("admin/pages/products/detail", {
            pageTitle: product.title,
            product: product
        });
    } catch (error) {      
        res.redirect(`${systemConfig.prefixAdmin}/products`)
        
    }
    
}

